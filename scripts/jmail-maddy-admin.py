#!/usr/bin/python3 -I
import difflib
import fcntl
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time

CONFIG = Path('/etc/maddy/maddy.conf')
STATE = Path('/etc/maddy/jmail-admin.json')
FORWARDS = Path('/etc/maddy/jmail-forwarding')
KEYS = Path('/var/lib/maddy/dkim_keys')
MADDY = '/usr/local/bin/maddy'
SYSTEMCTL = '/usr/bin/systemctl'
RUNUSER = '/usr/sbin/runuser'
DOMAIN = re.compile(r'(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$')
EMAIL = re.compile(r'[a-zA-Z0-9._%+\-]+@[^@]+$')


def domain(value):
    if not isinstance(value, str) or not DOMAIN.fullmatch(value):
        raise ValueError('Use a valid lowercase domain name')
    return value


def email(value):
    if not isinstance(value, str) or len(value) > 254 or not EMAIL.fullmatch(value):
        raise ValueError('Invalid email address')
    domain(value.split('@')[1])
    return value


def command(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=35,
                            env={'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'HOME': '/root'})
    if result.returncode:
        raise ValueError((result.stderr or result.stdout or 'Server command failed')[-2000:])
    return result.stdout.strip()


def macro(config, name):
    matches = list(re.finditer(r'^\$\(' + name + r'\)\s*=\s*([^\n#]+)', config, re.M))
    if len(matches) != 1:
        raise ValueError('Expected one $(' + name + ') assignment in /etc/maddy/maddy.conf')
    return matches[0]


def read_state():
    config = CONFIG.read_text()
    primary = domain(macro(config, 'primary_domain').group(1).strip())
    names = macro(config, 'local_domains').group(1).replace('$(primary_domain)', primary).split()
    names = list(dict.fromkeys([domain(n) for n in names]))
    if primary not in names:
        raise ValueError('Primary domain must be included in local_domains')
    saved = json.loads(STATE.read_text()) if STATE.exists() else {'domains': [], 'forwarding': []}
    hostname = domain(macro(config, 'hostname').group(1).strip())
    signing_lines = re.findall(r'^\s*dkim (?:\$\(primary_domain\) )?\$\(local_domains\) ([a-zA-Z0-9_-]+)\s*$', config, re.M)
    default_selector = signing_lines[0] if len(signing_lines) == 1 else 'default'
    domains = []
    for name in names:
        record = next((d for d in saved['domains'] if d['name'] == name), None)
        domains.append(record or {'name': name, 'mxHost': hostname, 'ipv4': '', 'ipv6': '', 'selector': default_selector})
    state = {'domains': domains, 'forwarding': saved['forwarding'], 'primaryDomain': primary}
    revision = hashlib.sha256(config.encode() + json.dumps(saved, sort_keys=True).encode() +
                              (FORWARDS.read_bytes() if FORWARDS.exists() else b'')).hexdigest()
    return config, state, revision


def validate_record(record):
    if not isinstance(record, dict):
        raise ValueError('Domain settings required')
    clean = {key: record.get(key, '') for key in ['name', 'mxHost', 'ipv4', 'ipv6', 'selector']}
    domain(clean['name'])
    domain(clean['mxHost'])
    if not isinstance(clean['selector'], str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,62}', clean['selector']):
        raise ValueError('Invalid DKIM selector')
    for key, version in [('ipv4', 4), ('ipv6', 6)]:
        if not isinstance(clean[key], str):
            raise ValueError('Invalid IP address')
        if clean[key] and ipaddress.ip_address(clean[key]).version != version:
            raise ValueError('Invalid ' + key + ' address')
    return clean


def signing(config, domains):
    start, end = '# jmail-dkim-start', '# jmail-dkim-end'
    lines = '\n'.join('                dkim ' + d['name'] + ' ' + d['selector'] for d in domains)
    replacement = start + '\n' + lines + '\n                ' + end
    if start in config:
        pattern = re.escape(start) + r'[\s\S]*?' + re.escape(end)
    else:
        pattern = r'dkim (?:\$\(primary_domain\) )?\$\(local_domains\) [a-zA-Z0-9_-]+[ \t]*(?=\n)'
    matches = list(re.finditer(pattern, config))
    if len(matches) != 1:
        raise ValueError('Cannot safely update custom DKIM routing. Expected one outgoing dkim $(local_domains) selector directive.')
    return config[:matches[0].start()] + replacement + config[matches[0].end():]


def forwarding_config(config):
    marker = '# jmail-forwarding'
    if marker in config:
        if config.count(marker) != 1 or 'replace_rcpt file ' + str(FORWARDS) not in config:
            raise ValueError('Managed forwarding configuration was changed outside JMail')
        return config
    pattern = (r'(msgpipeline local_routing\s*\{\s*'
               r'(?:#[^\n]*\n\s*)*destination postmaster \$\(local_domains\)\s*\{\s*'
               r'modify\s*\{\s*replace_rcpt &local_rewrites\s*)'
               r'\}\s*deliver_to &local_mailboxes')
    matches = list(re.finditer(pattern, config))
    if len(matches) != 1:
        raise ValueError('Cannot safely enable forwarding on custom local_routing. Expected the standard Maddy local delivery block.')
    match = matches[0]
    replacement = (match.group(1) + '\n            ' + marker + '\n'
                   '            replace_rcpt file ' + str(FORWARDS) + '\n        }\n'
                   '        reroute {\n'
                   '            destination postmaster $(local_domains) {\n'
                   '                deliver_to &local_mailboxes\n            }\n'
                   '            default_destination {\n'
                   '                deliver_to &remote_queue\n            }\n        }')
    return config[:match.start()] + replacement + config[match.end():]


def prepare(request, accounts):
    config, state, revision = read_state()
    if request.get('revision') != revision:
        raise ValueError('Configuration changed. Refresh and preview again.')
    updated = config
    if request.get('kind') == 'domain':
        record = validate_record(request.get('domain'))
        original = request.get('original')
        existing = next((d for d in state['domains'] if d['name'] == original), None)
        if original and not existing:
            raise ValueError('Domain no longer exists')
        if any(d['name'] == record['name'] and d['name'] != original for d in state['domains']):
            raise ValueError('Domain already exists')
        if original and original != record['name']:
            if original == state['primaryDomain'] or any(a.endswith('@' + original) for a in accounts):
                raise ValueError('Domains with mailboxes and the primary domain cannot be renamed')
            if any(f['source'].endswith('@' + original) or f['destination'].endswith('@' + original) for f in state['forwarding']):
                raise ValueError('Remove forwarding rules referencing this domain before renaming it')
        state['domains'] = [record if d['name'] == original else d for d in state['domains']]
        if not existing:
            state['domains'].append(record)
        match = macro(config, 'local_domains')
        updated = config[:match.start(1)] + ' '.join(d['name'] for d in state['domains']) + config[match.end(1):]
        updated = signing(updated, state['domains'])
    elif request.get('kind') == 'forwarding':
        source = email(request.get('source'))
        if source not in accounts:
            raise ValueError('Forwarding source must be an existing mailbox')
        state['forwarding'] = [f for f in state['forwarding'] if f['source'] != source]
        if request.get('destination'):
            destination = email(request['destination'])
            local_domains = {d['name'] for d in state['domains']}
            if destination.split('@')[1] in local_domains and destination not in accounts:
                raise ValueError('Local forwarding destination must be an existing mailbox')
            if source == destination:
                raise ValueError('A mailbox cannot forward to itself')
            if type(request.get('keepCopy')) is not bool:
                raise ValueError('Choose whether to keep a copy')
            state['forwarding'].append({'source': source, 'destination': destination, 'keepCopy': request['keepCopy']})
        # Single-hop local delivery
        sources = {f['source'] for f in state['forwarding']}
        if any(f['destination'] in sources for f in state['forwarding']):
            raise ValueError('Forwarding chains and loops are not supported. Choose a final destination.')
        updated = forwarding_config(updated)
    else:
        raise ValueError('Unknown configuration action')
    forward_text = ''.join(f["source"] + ': ' + (f["source"] + ', ' if f['keepCopy'] else '') +
                           f['destination'] + '\n' for f in state['forwarding'])
    saved = {'domains': state['domains'], 'forwarding': state['forwarding']}
    files = {CONFIG: updated, STATE: json.dumps(saved, indent=2) + '\n', FORWARDS: forward_text}
    diff = []
    for path, value in files.items():
        old = path.read_text() if path.exists() else ''
        diff.extend(difflib.unified_diff(old.splitlines(), value.splitlines(),
                                       fromfile=str(path), tofile=str(path), n=0, lineterm=''))
    return files, '\n'.join(diff)


def atomic_write(path, content):
    stat = path.stat() if path.exists() else None
    fd, temporary = tempfile.mkstemp(prefix='.jmail-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temporary, (stat.st_mode & 0o777) if stat else 0o644)
        if stat:
            os.chown(temporary, stat.st_uid, stat.st_gid)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def apply_files(files):
    previous = {p: p.read_text() if p.exists() else None for p in files}
    backup = CONFIG.parent / 'jmail-backups' / str(time.time_ns())
    backup.mkdir(parents=True, mode=0o700)
    for path, value in previous.items():
        if value is not None:
            (backup / path.name).write_text(value)
    restarted = False
    try:
        # Candidate validation beside relative includes
        fd, candidate = tempfile.mkstemp(prefix='.jmail-candidate-', dir=CONFIG.parent)
        forward_fd, candidate_forwards = tempfile.mkstemp(prefix='.jmail-forwards-', dir=CONFIG.parent)
        try:
            with os.fdopen(forward_fd, 'w') as stream:
                stream.write(files[FORWARDS])
            with os.fdopen(fd, 'w') as stream:
                stream.write(files[CONFIG].replace('replace_rcpt file ' + str(FORWARDS),
                                                  'replace_rcpt file ' + candidate_forwards))
            os.chmod(candidate, 0o644)
            os.chmod(candidate_forwards, 0o644)
            command([RUNUSER, '-u', 'maddy', '--', MADDY, '--config', candidate, 'verify-config'])
        finally:
            os.unlink(candidate)
            os.unlink(candidate_forwards)
        for path, value in files.items():
            atomic_write(path, value)
        restarted = True
        command([SYSTEMCTL, 'restart', 'maddy'])
        time.sleep(1)
        command([SYSTEMCTL, 'is-active', '--quiet', 'maddy'])
    except Exception as error:
        for path, value in previous.items():
            if value is None:
                path.unlink(missing_ok=True)
            else:
                atomic_write(path, value)
        if restarted:
            try:
                command([SYSTEMCTL, 'restart', 'maddy'])
                command([SYSTEMCTL, 'is-active', '--quiet', 'maddy'])
            except Exception as recovery:
                raise ValueError('Configuration restored, but Maddy recovery failed: ' + str(recovery)) from error
        raise ValueError('Change failed; previous files restored: ' + str(error)) from error
    return str(backup)


def status():
    config, state, revision = read_state()
    records = []
    for record in state['domains']:
        public_key = KEYS / (record['name'] + '_' + record['selector'] + '.dns')
        value = public_key.read_text() if public_key.exists() else ''
        records.append({**record, 'dkimRecord': value})
    try:
        active = command([SYSTEMCTL, 'is-active', 'maddy']) == 'active'
    except ValueError:
        active = False
    return {**state, 'domains': records, 'revision': revision, 'active': active,
            'forwardingReady': '# jmail-forwarding' in config}


def main():
    if len(sys.argv) != 1 or os.geteuid() != 0:
        raise ValueError('Run the installed helper through sudo with no command arguments')
    request = json.loads(sys.stdin.read(65537))
    lock = os.open('/run/lock/jmail-maddy-admin.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(lock, 'w') as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        action = request.get('action')
        if action == 'status':
            return status()
        if action not in ['preview', 'apply']:
            raise ValueError('Unknown helper action')
        accounts = command([RUNUSER, '-u', 'maddy', '--', MADDY, '--config', str(CONFIG), 'imap-acct', 'list']).splitlines()
        files, diff = prepare(request, [a.strip() for a in accounts])
        digest = hashlib.sha256(diff.encode()).hexdigest()
        if action == 'preview':
            return {'diff': diff, 'digest': digest}
        if request.get('digest') != digest:
            raise ValueError('Preview does not match the change. Preview again.')
        backup = apply_files(files)
        return {'ok': True, 'backup': backup, **status()}


if __name__ == '__main__':
    try:
        print(json.dumps(main()))
    except Exception as error:
        print(json.dumps({'error': str(error)}))
        sys.exit(1)
