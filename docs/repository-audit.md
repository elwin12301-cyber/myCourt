# Repository audit — myCourt

Audited: 2026-10-26, at commit `e697016` (before the Case Status work). No `.env` files or secrets exist in the repo.

## Purpose
myCourt is a front-end-only **advocate practice-management workspace** (matters, documents/OCR, AI assistant, research, hearing prep, calendar, intake, billing). It is a port of an HTML prototype (`mrcourt_interactive_prototype.html`). It is **not** an eCourts clone and was not turned into one.

## Stack
Vite 6, React 18, TypeScript 5.6 (strict), plain CSS in `src/styles.css`. No router, no state library, no backend, no database, no auth. Spec Kit scaffolding lives in `.specify/` and `.claude/` (the latter is git-ignored).

## Architecture
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Navigation is a `useState<PageId>` in `App.tsx`; a `PAGES` map renders one page component per id.
- Cross-page state (tasks, documents, chat, transcript, research query, toast, modal) is held in `App.tsx` and exposed through `AppContext` (`src/context.ts`).
- Shared UI primitives: `src/components/ui.tsx`. Shared modals: `src/pages/modals.tsx`.
- All data is hard-coded in components or `App.tsx`; everything resets on refresh.

## Modules / workflows (before this change)
Dashboard · Cases register + detail · AI assistant (canned replies keyed on words) · RAG research (static sample results) · Documents & OCR (local file list only) · Legal section mapping (always "Unverified") · Voice (simulated recorder) · Hearing prep · Calendar/tasks · Client intake · Time & billing.

## Strengths
- Strict TypeScript, small files, one coherent visual language.
- Honest disclaimers throughout ("not verified", "prototype only").
- Responsive CSS with a mobile sidebar.

## Weaknesses (evidence in `gap-analysis.md`)
- No automated tests, linter, or formatter existed.
- No URL routing: back button and deep links do not work.
- Accessibility gaps: modal had no dialog semantics, no skip link, no `aria-current`, no focus styles.
- Dashboard/Cases figures are hard-coded and not labelled as demo data.
- No backend, so no authentication, authorisation, audit trail, or persistence.
- Calendar marks day 23 as "today" statically (`src/pages/Calendar.tsx`).

## Known limitations
Client-side only; unsuitable for real client data. No external integrations.

## Uncertainties
- Whether a backend/Spec Kit feature spec is planned (none exists yet; `.specify/memory/constitution.md` is still the template).
- Intended deployment target.
