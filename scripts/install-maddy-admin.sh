#!/bin/sh
set -eu
[ "$(id -u)" = 0 ] || { echo 'Run with sudo: sudo sh scripts/install-maddy-admin.sh APP_USER'; exit 1; }
app_user=${1:?Pass the Linux user running JMail}
case "$app_user" in *[!a-zA-Z0-9_-]*|'') echo 'Invalid app user'; exit 1 ;; esac
id "$app_user" >/dev/null
[ -x /usr/bin/python3 ] || { echo 'Python 3 is required'; exit 1; }
[ -x /usr/local/bin/maddy ] || { echo 'Expected /usr/local/bin/maddy'; exit 1; }
[ -f /etc/maddy/maddy.conf ] || { echo 'Expected /etc/maddy/maddy.conf'; exit 1; }
command -v visudo >/dev/null
[ -x /usr/sbin/runuser ] || { echo 'runuser is required'; exit 1; }
id maddy >/dev/null
[ -x /usr/bin/systemctl ] || { echo 'systemd is required'; exit 1; }
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
install -o root -g root -m 0755 "$script_dir/jmail-maddy-admin.py" /usr/local/sbin/jmail-maddy-admin
sudoers_temp=$(mktemp)
trap 'rm -f "$sudoers_temp"' EXIT
printf '%s ALL=(root) NOPASSWD: /usr/local/sbin/jmail-maddy-admin ""\n' "$app_user" > "$sudoers_temp"
visudo -cf "$sudoers_temp"
install -o root -g root -m 0440 "$sudoers_temp" /etc/sudoers.d/jmail-maddy-admin
echo 'Maddy administration installed. Open Admin > Mail server in JMail.'
