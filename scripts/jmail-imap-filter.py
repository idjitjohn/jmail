#!/usr/bin/python3 -I
import email.policy
from email.parser import BytesHeaderParser
import json
from pathlib import Path
import re
import sys

DIRECTORY = Path('/var/lib/maddy/sieve')


def destination(account, header):
    if not re.fullmatch(r'[a-zA-Z0-9@._-]+', account):
        return ''
    file = DIRECTORY / (account + '.json')
    try:
        config = json.loads(file.read_text())
    except FileNotFoundError:
        return ''
    message = BytesHeaderParser(policy=email.policy.default).parsebytes(header)
    for rule in config.get('filters', [])[:100]:
        if not rule.get('enabled') or rule.get('action') != 'move':
            continue
        field = rule.get('field')
        value = rule.get('contains')
        folder = rule.get('destination')
        if field not in ('from', 'to', 'subject') or not isinstance(value, str) or not value:
            continue
        if not isinstance(folder, str) or not folder.strip() or len(folder) > 160 or any(ord(char) < 32 or ord(char) == 127 for char in folder):
            continue
        if value.casefold() in str(message.get(field, '')).casefold():
            return folder
    return ''


def main():
    if len(sys.argv) != 2:
        return
    header = bytearray()
    reading_header = True
    for line in sys.stdin.buffer:
        if reading_header:
            if len(header) + len(line) <= 262144:
                header.extend(line)
            else:
                reading_header = False
                header.clear()
            if line in (b'\r\n', b'\n'):
                reading_header = False
    if header:
        folder = destination(sys.argv[1], bytes(header))
        if folder:
            print(folder)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('JMail filter failed; default delivery preserved', file=sys.stderr)
