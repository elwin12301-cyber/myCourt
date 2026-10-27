# myCourt

A React + TypeScript front-end prototype of an advocate practice workspace (matters, documents, AI assistant, hearing prep, calendar, billing), plus a reference section that reproduces the public information structure of the eCourts portal and a demo **Case Status** search.

> **Demonstration only.** All case, client and financial data is fictional. myCourt is not the official eCourts portal and is not affiliated with the Indian judiciary. Verify everything on [ecourts.gov.in](https://ecourts.gov.in/ecourts2.0/).

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18 or newer (developed on 22.17) | Includes npm |
| npm | 9 or newer (developed on 10.9) | Installed with Node.js |
| [Git](https://git-scm.com/) | any recent version | To clone and contribute |
| A modern browser | current Chrome, Edge, Firefox or Safari | To view the app |
| Internet access | for `npm install` | The app itself needs no backend or API keys |

Optional, only if you want the Spec Kit workflow (`/speckit-*` commands):

| Tool | Purpose |
|---|---|
| [uv](https://docs.astral.sh/uv/) | Installs the Specify CLI |
| Specify CLI (`specify`) | Spec-driven development scaffolding in `.specify/` |
| [Claude Code](https://claude.com/claude-code) | Runs the skills in `.claude/skills` |

Check your setup:

```bash
node -v
npm -v
git --version
```

## Getting started

```bash
git clone https://github.com/elwin12301-cyber/myCourt.git
cd myCourt
npm install
npm run dev
```

Open the address Vite prints (normally http://localhost:5173; it picks the next free port if that one is busy).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests (Vitest) |

## What's in the app

- **Workspace:** dashboard, cases, **case status** (eight demo search types), **cause list** and **court orders**, a full **eCourts Services site** prototype (caveat search, process details, location and more), AI assistant, research, documents and OCR, section mapping, voice notes, hearing preparation, calendar, client intake, billing.
- **eCourts portal reference:** overview, About, High Courts, District Courts, Forms for Advocates, Contact, Help, and portal search. A snapshot of public information dated 2026-10-26.
- **Accessibility:** skip link, keyboard-operable controls, and an **Aa** display menu (text size, contrast, invert, grayscale, link highlight, spacing, line height, hide images, big cursor).

## Project structure

```
src/
  App.tsx               shell, navigation, toast and modal
  router.ts             hash-based page routing (#/caseStatus)
  pages/                one component per screen
  components/           shared UI, display settings, external-link alert
  features/
    caseStatus/         validation, mock adapter, tests
    portal/             eCourts snapshot data, search, tests
    calendar.ts         month grid helper
docs/                   audit, eCourts analysis, gap analysis, plan, prototype guide
.specify/               Spec Kit constitution and templates
```

## Data and integrations

There is no backend. Case Status reads from a mock adapter behind the `CaseSearchAdapter` interface (`src/features/caseStatus/types.ts`). A real integration must be a server-side service that uses an authorised data source; do not scrape the official site or bypass its CAPTCHA. See `docs/implementation-plan.md`.

## Documentation

- [Repository audit](docs/repository-audit.md)
- [eCourts reference analysis](docs/ecourts-reference-analysis.md)
- [Gap analysis](docs/gap-analysis.md)
- [Implementation plan](docs/implementation-plan.md)
- [Prototype guide](docs/prototype-guide.md)
- [Project constitution](.specify/memory/constitution.md)

## Known limitations

No login, storage or backend; data resets on refresh. Portal counters are a snapshot and may be out of date. Only English is available in the language selector. No linter is configured yet.
