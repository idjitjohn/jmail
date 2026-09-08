#!/bin/sh
set -eu
[ "$(id -u)" = 0 ] || { echo 'Run with sudo: sudo sh scripts/install-mail-worker.sh APP_USER PROJECT_DIRECTORY'; exit 1; }
app_user=${1:?Pass the user running JMail}
project_dir=${2:?Pass the absolute JMail project directory}
case "$app_user" in *[!a-zA-Z0-9_-]*|'') echo 'Invalid app user'; exit 1 ;; esac
case "$project_dir" in /*) ;; *) echo 'Use an absolute project directory'; exit 1 ;; esac
case "$project_dir" in *[!a-zA-Z0-9_./-]*) echo 'Project path must not contain whitespace or special characters'; exit 1 ;; esac
id "$app_user" >/dev/null
[ -f "$project_dir/scripts/run-mail-worker.mjs" ] || { echo 'Worker script not found'; exit 1; }
node_bin=$(command -v node) || { echo 'Node.js must be available to install the worker'; exit 1; }
case "$node_bin" in *[!a-zA-Z0-9_./-]*) echo 'Unsupported Node.js path'; exit 1 ;; esac
cat > /etc/systemd/system/jmail-worker.service <<UNIT
[Unit]
Description=JMail scheduled mail and reminders
After=network-online.target maddy.service
[Service]
Type=oneshot
User=$app_user
WorkingDirectory=$project_dir
ExecStart=$node_bin $project_dir/scripts/run-mail-worker.mjs
TimeoutStartSec=120
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
UNIT
cat > /etc/systemd/system/jmail-worker.timer <<'UNIT'
[Unit]
Description=Check JMail scheduled messages every minute
[Timer]
OnBootSec=60
OnUnitInactiveSec=60
AccuracySec=5
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now jmail-worker.timer
echo 'Mail worker timer installed. Set CRON_SECRET in the JMail environment and restart the app if it is not already configured.'
