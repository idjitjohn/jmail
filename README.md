<div align="center">

# ✉️ JMail

**A self-hosted webmail client built for speed, privacy, and elegance.**
Pair it with [Maddy](https://maddy.email) and own your email — completely.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1?style=flat-square&logo=bun)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## What is JMail?

JMail is a clean, fast, macOS-inspired webmail interface for [Maddy Mail Server](https://maddy.email). No third-party services. No tracking. No subscription. Your emails stay on your machine, and you access them through a beautiful UI that feels like it belongs on Apple hardware.

It is not a toy project — it is a complete, production-ready webmail stack with authentication, IMAP/SMTP, mail forwarding via Sieve scripts, and a full admin panel for account management.

---

## Features

### ✉️ Mail
- Read, write, reply, and delete emails
- Folder navigation — Inbox, Sent, Drafts, Trash, Spam, Archive
- HTML email rendering with sanitization
- Attachment detection
- Pagination for large mailboxes

### ⚙️ User Settings
- **Mail forwarding** — redirect incoming mail to any address via Sieve scripts
- Keep-a-copy toggle — forward AND keep a local copy, or forward-only
- Settings persist server-side in `/var/lib/maddy/sieve/`

### 🛡️ Admin Panel
- Create and delete user accounts
- Reset passwords
- Filter accounts by domain
- Dashboard with per-domain statistics

### 🎨 UI / UX
- macOS-inspired design system — clean, minimal, familiar
- Light & dark mode, respects system preference, persists to localStorage
- Fully responsive layout
- Zero UI framework dependency — pure Sass + Tailwind CSS variables

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| Language | TypeScript 5 |
| Styling | Sass + Tailwind CSS 4 |
| Auth | JWT via `jose` (HS256, 24h sessions) |
| IMAP | `imapflow` |
| SMTP | `nodemailer` |
| Mail server | [Maddy](https://maddy.email) |
| Filtering | Sieve scripts |

---

## Project Structure

```
app/
  (app)/            → Protected user routes (inbox, settings)
  (admin)/          → Protected admin routes
  api/              → API routes (auth, messages, folders, settings, admin)
components/         → All UI components (PascalCase, co-located SCSS + logic hooks)
lib/                → Server utilities (auth, mail clients, maddy CLI, types)
proxy.ts            → Next.js 16 route proxy (auth guards)
```

Every component follows a strict convention:
```
ComponentName/
  index.tsx         → JSX + Props only
  ComponentName.scss → Styles (Sass, BEM-root + kebab-case children)
  useComponentName.ts → All state and logic
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A running [Maddy](https://maddy.email) mail server
- Node.js ≥ 20 (for compatibility)

### Install

```bash
git clone https://github.com/youruser/jmail
cd jmail
bun install
```

### Environment

Create a `.env.local` file:

```env
# Required
NEXTAUTH_SECRET=your-random-64-character-secret

# Admin panel access
ADMIN_EMAIL=admin@yourdomain.com

# Mail server (defaults shown)
MAIL_HOST=localhost
IMAP_PORT=993
SMTP_PORT=465

# Maddy binary path (default shown)
MADDY_BIN=/usr/local/bin/maddy
```

### Development

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any Maddy account credentials.

---

## Production Deployment

JMail is designed to run as the `maddy` system user — this gives it permission to write Sieve scripts and call the `maddy` CLI without elevated privileges.

### 1. Allow passwordless sudo for the maddy CLI

JMail calls `sudo /usr/local/bin/maddy` to manage accounts and credentials. Grant the app user (e.g. `www-data` or whichever user runs the process) passwordless access:

```bash
echo "www-data ALL=(ALL) NOPASSWD: /usr/local/bin/maddy" | sudo tee /etc/sudoers.d/jmail-maddy
sudo chmod 440 /etc/sudoers.d/jmail-maddy
```

Replace `www-data` with the actual user running JMail.

### 2. Prepare the Sieve directory

```bash
mkdir -p /var/lib/maddy/sieve
chown maddy:maddy /var/lib/maddy/sieve
```

### 2. Build

```bash
bun run build
```

### 3. Systemd service

```ini
[Unit]
Description=JMail webmail
After=network.target maddy.service

[Service]
Type=simple
User=maddy
WorkingDirectory=/opt/jmail
ExecStart=/usr/bin/bun run start
Restart=on-failure

Environment=NODE_ENV=production
Environment=NEXTAUTH_SECRET=your-secret-here
Environment=ADMIN_EMAIL=admin@yourdomain.com

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now jmail
```

### 4. Maddy — enable Sieve filtering

Add to your `maddy.conf` if not already present:

```
msgpipeline local_routing {
    destination postmaster $(local_domains) {
        modify {
            replace_rcpt &local_rewrites
        }
        filter sieve /var/lib/maddy/sieve/{account}
        deliver_to &local_mailboxes
    }
}
```

---

## Security

- Passwords are verified live against IMAP — no password storage
- Sessions are short-lived JWT tokens (24h), signed with HS256
- `NEXTAUTH_SECRET` must be set to a strong random value in production
- Sieve paths are sanitized against path traversal attacks
- HTML emails are sanitized with `sanitize-html` before rendering
- Admin routes are double-gated: proxy-level + server component check

---

## Roadmap

- [ ] Vacation auto-reply (Sieve `vacation` extension)
- [ ] Advanced mail filters (move to folder by sender/subject)
- [ ] Mail signature editor
- [ ] Password change from settings
- [ ] Multi-account support

---

<div align="center">

Built with care for people who believe email should be yours.

</div>
