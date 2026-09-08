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
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g root -m 0755 "$script_dir/jmail-imap-filter.py" /usr/local/libexec/jmail-imap-filter
install -d -o "$app_user" -g maddy -m 2770 /var/lib/maddy/sieve
for directory in /var/lib/maddy/jmail /var/lib/maddy/userdata; do
  [ ! -L "$directory" ] || { echo 'Refusing a symbolic link in JMail runtime directories'; exit 1; }
  install -d -o "$app_user" -g maddy -m 0700 "$directory"
done
for name in scheduled later; do
  legacy_file="/var/lib/maddy/$name.json"
  runtime_file="/var/lib/maddy/jmail/$name.json"
  if [ -f "$legacy_file" ] && [ ! -L "$legacy_file" ] && [ ! -e "$runtime_file" ]; then
    install -o "$app_user" -g maddy -m 0600 "$legacy_file" "$runtime_file"
    rm "$legacy_file"
  fi
done
sudoers_temp=$(mktemp)
trap 'rm -f "$sudoers_temp"' EXIT
printf '%s ALL=(root) NOPASSWD: /usr/local/sbin/jmail-maddy-admin ""\n' "$app_user" > "$sudoers_temp"
visudo -cf "$sudoers_temp"
install -o root -g root -m 0440 "$sudoers_temp" /etc/sudoers.d/jmail-maddy-admin
echo 'Maddy administration installed. Open Admin > Mail server in JMail.'
