# Phishing Susceptibility Study App

A desktop application for a lab-based research study on phishing susceptibility. Participants interact with a simulated Outlook-style email inbox (inside a simulated browser) containing a mix of legitimate and phishing emails, and their responses — what action they take, how confident they are, how long they take, where they hover, what they click — are logged for analysis.

This app is one component of a larger multimodal study. Video and physiological data are captured separately by other tools running in parallel; this app is responsible for the task itself plus keystroke/mouse logging during the session.

## What it does

- Walks a participant through: consent → instructions → simulated inbox task → debrief.
- Presents 8–12 emails (mix of phishing and legitimate) in an Outlook Web-style UI, wrapped inside a simulated Chrome-style browser window.
- For each email, the participant picks an action — **Reply, Forward, Report as Phishing, Delete, Ignore,** or **Click Link** — and rates their confidence (0–100) in that choice.
  - Delete and Report ask for a yes/no confirmation first (they're destructive — the email moves to Deleted Items / Junk Email).
  - Reply and Forward open an inline compose view (Forward lets you pick a contact or type an address).
  - Clicking a link opens a new tab in the simulated browser showing the link's destination (currently a placeholder page — designing real fake destination pages, e.g. fake login forms, is future work). The action and confidence rating aren't logged until the participant returns to the inbox tab, so the time recorded includes however long they spent on the linked page.
- Logs, per participant per email: action taken, confidence rating, time to decision, whether they changed their action before confirming, link-hover events, and more.
- Also logs keystrokes and mouse movement continuously throughout the session, plus a session-start timestamp, for syncing against externally-recorded video/physiological data.
- Email content (and which ones are "correct" to flag as phishing) lives in plain JSON config files — no code changes needed to edit or add emails.
- All data lands in PostgreSQL; a script exports everything to CSV for analysis.

## Architecture

- **Frontend:** React + TypeScript, wrapped in Electron (the whole UI, including the simulated browser chrome, is the Electron renderer).
- **Backend:** Python FastAPI, auto-started by Electron's main process on launch (no need to run it separately).
- **Database:** PostgreSQL, running natively on the machine (no Docker).
- **Content config:** Plain JSON files under `config/`, read by the backend and served to the frontend over HTTP.

```
Simulation/
├── backend/            FastAPI app, SQLAlchemy models, CSV export script
│   └── app/
├── frontend/            Electron + React app
│   ├── electron/         Electron main process + preload script
│   └── src/
│       └── screens/
│           ├── browser/  Simulated browser chrome (tabs, address bar, window controls)
│           └── mail/     Simulated Outlook mail client
└── config/
    ├── emails/           One JSON file per email in the study set
    └── contacts.json     Address book used by the Forward action
```

## Installation

### Prerequisites

- **Node.js** (v20+; developed against v24) — install via [nvm](https://github.com/nvm-sh/nvm) recommended
- **Python** 3.12+
- **PostgreSQL** 16 (installed natively — no Docker)

### 1. Database setup

Install PostgreSQL if it isn't already:

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
```

Create the dev database and user:

```bash
sudo -u postgres psql -c "CREATE USER phishing_study WITH PASSWORD 'devpassword';" \
                       -c "CREATE DATABASE phishing_study OWNER phishing_study;"
```

### 2. Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The backend reads its config from `backend/.env` (already present in this repo for local dev):

```
DATABASE_URL=postgresql://phishing_study:devpassword@localhost:5432/phishing_study
HOST=127.0.0.1
PORT=8000
```

Tables are created automatically on first run (no migrations needed).

### 3. Frontend setup

```bash
cd frontend
npm install
```

## Running the app

```bash
cd frontend
npm run electron:dev
```

This starts the Vite dev server, launches the Electron window, and Electron automatically spawns the FastAPI backend (using the venv created above) — nothing else needs to be started manually. Closing the app window shuts everything down cleanly.

## Editing the email content

Each email in the study is its own JSON file in `config/emails/`, e.g.:

```json
{
  "id": "phish_001_account_verify",
  "sender": "IT Support <it-support@brightwave-secure-verify.com>",
  "subject": "Urgent: Verify Your Account Within 24 Hours",
  "body": "Dear Employee,\n\n...",
  "link": "http://brightwave-secure-verify.com/verify-account",
  "attachment": null,
  "is_phishing": true
}
```

Add a new email by dropping in a new file — no restart required beyond reloading the app. `is_phishing` is the ground-truth label; it's never sent to the frontend, only used server-side (e.g. in the CSV export) so participants can't inspect it.

Contacts available in the Forward action's address book live in `config/contacts.json`, a flat list of `{ "name": ..., "email": ... }`.

## Exporting data

```bash
cd backend
source .venv/bin/activate
python export_csv.py
```

Writes a timestamped folder under `backend/exports/` containing one CSV per table: `participants`, `email_interactions` (enriched with each email's `is_phishing` ground truth), `hover_events`, `keystroke_events`, `mouse_events`, `session_events`.

Pass a path to control the output location: `python export_csv.py path/to/output`.

## Resetting the database between participants

```bash
PGPASSWORD=devpassword psql -h localhost -U phishing_study -d phishing_study \
  -c "TRUNCATE hover_events, keystroke_events, mouse_events, session_events, email_interactions, participants RESTART IDENTITY CASCADE;"
```

## Known placeholders / not yet finalized

- Consent and instructions screen text are placeholders — finalize wording with IRB before running real sessions.
- Link-click destination pages are blank placeholders; designing realistic fake pages (login forms, warning pages, etc.) per email is planned future work.
- Simulated browser security warnings and fake password-manager prompts are not implemented yet.
