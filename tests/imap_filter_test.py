import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

root = Path(__file__).parents[1]
spec = importlib.util.spec_from_file_location('imap_filter', root / 'scripts/jmail-imap-filter.py')
filters = importlib.util.module_from_spec(spec)
spec.loader.exec_module(filters)
admin_spec = importlib.util.spec_from_file_location('filter_admin', root / 'scripts/jmail-maddy-admin.py')
admin = importlib.util.module_from_spec(admin_spec)
admin_spec.loader.exec_module(admin)


class ImapFilterTests(unittest.TestCase):
    def test_decoded_headers_and_first_matching_rule(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(filters, 'DIRECTORY', Path(directory)):
            (Path(directory) / 'me@example.org.json').write_text(json.dumps({'filters': [
                {'enabled': True, 'field': 'subject', 'contains': 'réunion', 'action': 'move', 'destination': 'Projects'},
                {'enabled': True, 'field': 'from', 'contains': '@example.org', 'action': 'move', 'destination': 'People'},
            ]}))
            header = b'From: sender@example.org\r\nSubject: =?utf-8?b?UsOpdW5pb24=?=\r\n\r\n'
            self.assertEqual(filters.destination('me@example.org', header), 'Projects')
            self.assertEqual(filters.destination('../me@example.org', header), '')
            self.assertEqual(filters.destination('missing@example.org', header), '')

    def test_invalid_folder_cannot_inject_imap_flags(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(filters, 'DIRECTORY', Path(directory)):
            file = Path(directory) / 'me@example.org.json'
            file.write_text(json.dumps({'filters': [{'enabled': True, 'field': 'subject', 'contains': 'hello', 'action': 'move', 'destination': 'Inbox\n\\Seen'}]}))
            self.assertEqual(filters.destination('me@example.org', b'Subject: hello\r\n\r\n'), '')

    def test_filter_configuration_is_reversible_and_preserves_custom_content(self):
        with tempfile.TemporaryDirectory() as directory:
            executable = Path(directory) / 'filter'
            executable.touch()
            config = 'storage.imapsql local_mailboxes {\n    driver sqlite3\n    dsn imap.db\n}\n'
            with patch.object(admin, 'FILTER', executable):
                updated = admin.filter_config(config, True)
                self.assertIn('command /usr/local/libexec/jmail-imap-filter {account_name}', updated)
                self.assertEqual(admin.filter_config(updated, True), updated)
                self.assertEqual(admin.filter_config(updated, False), config)
                with self.assertRaisesRegex(ValueError, 'existing custom'):
                    admin.filter_config(config.replace('    driver', '    imap_filter { command custom }\n    driver'), True)

    def test_installation_required_before_enabling_filters(self):
        with patch.object(admin, 'FILTER', Path('/not-installed/filter')):
            with self.assertRaisesRegex(ValueError, 'installer'):
                admin.filter_config('storage.imapsql local_mailboxes {\n}\n', True)
