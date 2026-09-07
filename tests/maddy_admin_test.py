import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('admin', Path(__file__).parents[1] / 'scripts/jmail-maddy-admin.py')
admin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)

CONFIG = '''$(hostname) = smtp.example.org
$(primary_domain) = example.org
$(local_domains) = $(primary_domain) existing.org
msgpipeline local_routing {
    destination postmaster $(local_domains) {
        modify {
            replace_rcpt &local_rewrites
        }
        deliver_to &local_mailboxes
    }
    default_destination {
        reject 550 5.1.1 "User doesn't exist"
    }
}
submission tls://0.0.0.0:465 {
    source $(local_domains) {
        default_destination {
            modify {
                dkim $(primary_domain) $(local_domains) default
            }
            deliver_to &remote_queue
        }
    }
}
'''


class MaddyAdminTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.patches = [patch.object(admin, name, self.root / path) for name, path in
                        [('CONFIG', 'maddy.conf'), ('STATE', 'state.json'), ('FORWARDS', 'forwarding'), ('KEYS', 'keys')]]
        for item in self.patches:
            item.start()
        admin.CONFIG.write_text(CONFIG)
        self.accounts = ['admin@example.org', 'contact@existing.org', 'target@example.org']

    def tearDown(self):
        for item in self.patches:
            item.stop()
        self.directory.cleanup()

    def change(self, **kwargs):
        return {'revision': admin.read_state()[2], **kwargs}

    def record(self, name='new.org'):
        return {'name': name, 'mxHost': 'smtp.example.org', 'ipv4': '192.0.2.1', 'ipv6': '2001:db8::1', 'selector': 'default'}

    def test_imports_live_domains(self):
        self.assertEqual([d['name'] for d in admin.read_state()[1]['domains']], ['example.org', 'existing.org'])

    def test_imports_existing_selector(self):
        admin.CONFIG.write_text(CONFIG.replace('$(local_domains) default', '$(local_domains) mail2026'))
        self.assertEqual(admin.read_state()[1]['domains'][0]['selector'], 'mail2026')

    def test_add_updates_routing_and_signing_without_mutation(self):
        files, diff = admin.prepare(self.change(kind='domain', domain=self.record()), self.accounts)
        self.assertIn('$(local_domains) = example.org existing.org new.org', files[admin.CONFIG])
        self.assertIn('dkim new.org default', files[admin.CONFIG])
        self.assertIn('reject 550', files[admin.CONFIG])
        self.assertIn('+', diff)
        self.assertEqual(admin.CONFIG.read_text(), CONFIG)
        self.assertFalse(admin.STATE.exists())

    def test_edit_preserves_other_domains_and_custom_sections(self):
        files, _ = admin.prepare(self.change(kind='domain', original='existing.org', domain=self.record('existing.org')), self.accounts)
        self.assertIn('dkim example.org default', files[admin.CONFIG])
        self.assertEqual(len(json.loads(files[admin.STATE])['domains']), 2)

    def test_rejects_duplicate_and_stale_revision(self):
        with self.assertRaisesRegex(ValueError, 'already exists'):
            admin.prepare(self.change(kind='domain', domain=self.record('existing.org')), self.accounts)
        with self.assertRaisesRegex(ValueError, 'changed'):
            admin.prepare({'revision': 'old', 'kind': 'domain', 'domain': self.record()}, self.accounts)

    def test_rejects_config_and_path_injection(self):
        for name in ['example.org\ninclude /tmp/evil', '../example.org', 'example.org;run', '$(hostname)', '-x.org']:
            with self.assertRaises(ValueError):
                admin.prepare(self.change(kind='domain', domain=self.record(name)), self.accounts)
        record = self.record()
        record['selector'] = '../../private'
        with self.assertRaises(ValueError):
            admin.validate_record(record)

    def test_rejects_invalid_ip(self):
        record = self.record()
        record['ipv6'] = '192.0.2.1'
        with self.assertRaises(ValueError):
            admin.validate_record(record)

    def test_rename_protects_mailboxes_and_primary(self):
        for original in ['example.org', 'existing.org']:
            with self.assertRaisesRegex(ValueError, 'cannot be renamed'):
                admin.prepare(self.change(kind='domain', original=original, domain=self.record()), self.accounts)

    def test_rejects_custom_signing(self):
        admin.CONFIG.write_text(CONFIG.replace('dkim $(primary_domain) $(local_domains) default', 'dkim example.org custom'))
        with self.assertRaisesRegex(ValueError, 'custom DKIM'):
            admin.prepare(self.change(kind='domain', domain=self.record()), self.accounts)

    def test_forwarding_keeps_local_copy_and_routes_external(self):
        files, _ = admin.prepare(self.change(kind='forwarding', source='contact@existing.org', destination='outside@other.org', keepCopy=True), self.accounts)
        self.assertEqual(files[admin.FORWARDS], 'contact@existing.org: contact@existing.org, outside@other.org\n')
        self.assertIn('reroute {', files[admin.CONFIG])
        self.assertIn('reject 550', files[admin.CONFIG])
        self.assertEqual(admin.forwarding_config(files[admin.CONFIG]), files[admin.CONFIG])

    def test_forwarding_requires_real_local_mailbox(self):
        for source, destination in [('missing@existing.org', 'x@other.org'), ('admin@example.org', 'missing@existing.org')]:
            with self.assertRaises(ValueError):
                admin.prepare(self.change(kind='forwarding', source=source, destination=destination, keepCopy=True), self.accounts)

    def test_forwarding_rejects_self_and_chains(self):
        with self.assertRaisesRegex(ValueError, 'itself'):
            admin.prepare(self.change(kind='forwarding', source='admin@example.org', destination='admin@example.org', keepCopy=True), self.accounts)
        admin.STATE.write_text(json.dumps({'domains': [], 'forwarding': [{'source': 'target@example.org', 'destination': 'outside@other.org', 'keepCopy': True}]}))
        with self.assertRaisesRegex(ValueError, 'chains'):
            admin.prepare(self.change(kind='forwarding', source='admin@example.org', destination='target@example.org', keepCopy=True), self.accounts)

    def test_custom_routing_refused(self):
        admin.CONFIG.write_text(CONFIG.replace('replace_rcpt &local_rewrites', 'replace_rcpt file /custom/aliases'))
        with self.assertRaisesRegex(ValueError, 'custom local_routing'):
            admin.prepare(self.change(kind='forwarding', source='admin@example.org', destination='x@other.org', keepCopy=False), self.accounts)

    def test_validation_failure_never_restarts_or_changes_files(self):
        files, _ = admin.prepare(self.change(kind='domain', domain=self.record()), self.accounts)
        with patch.object(admin, 'command', side_effect=ValueError('invalid config')) as command:
            with self.assertRaisesRegex(ValueError, 'restored'):
                admin.apply_files(files)
        self.assertEqual(command.call_count, 1)
        self.assertEqual(admin.CONFIG.read_text(), CONFIG)
        self.assertFalse(admin.STATE.exists())
        self.assertFalse(admin.FORWARDS.exists())

    def test_restart_failure_restores_and_recovers(self):
        files, _ = admin.prepare(self.change(kind='domain', domain=self.record()), self.accounts)
        with patch.object(admin, 'command', side_effect=['', ValueError('restart failed'), '', '']) as command:
            with self.assertRaisesRegex(ValueError, 'restored'):
                admin.apply_files(files)
        self.assertEqual(command.call_count, 4)
        self.assertEqual(admin.CONFIG.read_text(), CONFIG)
        self.assertFalse(admin.STATE.exists())

    def test_success_validates_before_writing_live_files(self):
        files, _ = admin.prepare(self.change(kind='domain', domain=self.record()), self.accounts)
        def command(args):
            if 'verify-config' in args:
                self.assertEqual(admin.CONFIG.read_text(), CONFIG)
                self.assertFalse(admin.FORWARDS.exists())
            return ''
        with patch.object(admin, 'command', side_effect=command), patch.object(admin.time, 'sleep'):
            backup = admin.apply_files(files)
        self.assertEqual(admin.CONFIG.read_text(), files[admin.CONFIG])
        self.assertEqual((Path(backup) / 'maddy.conf').read_text(), CONFIG)
        self.assertEqual(len(admin.read_state()[1]['domains']), 3)

    def test_second_domain_update_preserves_managed_signing(self):
        files, _ = admin.prepare(self.change(kind='domain', domain=self.record()), self.accounts)
        for path, value in files.items():
            path.write_text(value)
        files, _ = admin.prepare(self.change(kind='domain', domain=self.record('another.org')), self.accounts)
        self.assertEqual(files[admin.CONFIG].count('# jmail-dkim-start'), 1)
        self.assertIn('dkim new.org default', files[admin.CONFIG])
        self.assertIn('dkim another.org default', files[admin.CONFIG])


if __name__ == '__main__':
    unittest.main()
