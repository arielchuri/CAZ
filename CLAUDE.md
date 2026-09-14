# CAZ OS — Claude Code Guide

## Project Overview

Community Autonomous Zone (CAZ) OS is a mutual aid platform for offline communities. The current build covers **section 2.2 only**: the Peer-to-Peer Mutual Aid Matcher ("Give & Take" board).

## File Structure

```
TAZ/
├── client/                         # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/                 # brutx components (copy-pasted via npx brutx@latest add)
│   │   │       ├── button.jsx
│   │   │       ├── card.jsx
│   │   │       ├── badge.jsx
│   │   │       ├── input.jsx
│   │   │       ├── textarea.jsx
│   │   │       └── select.jsx
│   │   ├── GiveBoard.jsx           # list of offer/skill cards
│   │   ├── TakeBoard.jsx           # list of need/request cards
│   │   ├── PostForm.jsx            # form to post a Give or Take entry
│   │   ├── App.jsx                 # two-column layout
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                         # Node/Express backend
│   ├── data/
│   │   ├── skills.json             # offer entries (what people can give)
│   │   └── needs.json              # need entries (what people are requesting)
│   ├── routes/
│   │   └── matcher.js              # API route handlers
│   ├── index.js                    # Express entry point
│   └── package.json
│
├── docs/
│   └── plan/                       # implementation plans (markdown)
│
└── README.md
```

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **UI Components:** [brutx](https://brutalist.precast.dev/) — neo-brutalist copy-paste components (Radix UI + Tailwind)
- **Backend:** Node.js, Express
- **Data storage:** Flat JSON files (`server/data/`)

## Dev Commands

```bash
# Start backend (port 3001)
cd server && node index.js

# Start frontend (Vite proxies /api → localhost:3001)
cd client && npm run dev
```

## Conventions

- Plans go in `docs/plan/` as markdown files.
- brutx components live in `client/src/components/ui/` as editable source — **ask before modifying any file in that directory**.
- Data is read/written via the Express API only — the frontend never touches JSON files directly.

## Testing

Run tests automatically after any code change. If no test suite exists yet, note it rather than skipping silently.

## Hard Limits

- **No external services:** No third-party APIs, analytics, tracking, or any runtime call that requires internet.
- **No databases:** Storage stays as flat JSON files — no SQLite, MongoDB, Postgres, or ORMs.
- **No Docker or deployment config:** Don't add Dockerfiles, docker-compose, CI pipelines, or cloud infra.

## Design Philosophy

- **Offline-first:** No external API calls, no CDN links, no runtime internet dependencies. Everything must work on a local mesh network with no internet access.
- **Minimal & lean:** Only build what is explicitly asked for. Resist adding features, abstractions, or polish beyond the stated scope.
