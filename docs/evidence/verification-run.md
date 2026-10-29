# Verification run, 2026-10-29

This is the unedited output of one complete run of every automated check in the repository (script: the commands in the left column below), made while the SRS was being updated. Every number quoted in `docs/SRS.md` section 9 comes from this run.

| Layer | Command | Where it runs |
|---|---|---|
| Backend tests | `python -m pytest -q` | in-memory SQLite |
| Backend tests, PostgreSQL | `python -m pytest -m postgres tests/postgres -q` | PostgreSQL 16 in Docker |
| Types | `npx tsc --noEmit -p .` | frontend |
| Lint | `npx eslint .` | frontend |
| Unit and render tests | `npx vitest run` | frontend |
| Build | `npx vite build` | frontend |
| Dependencies | `npm audit` | frontend |
| Browser checks (real Chrome) | `node specs/<spec>/browser-check.mjs` | 006, 002, 001, 005 on the frontend in mock mode; 004 on a throw-away PostgreSQL database with a real backend |

```text
RUN_STARTED 2026-10-29T15:58:41Z
== backend pytest (sqlite)
-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
123 passed, 4 deselected, 7 warnings in 19.70s
== backend pytest (postgres)
-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
4 passed, 2 warnings in 1.89s
== frontend tsc
tsc: clean
== frontend eslint
eslint: clean
== frontend vitest (all)
 Test Files  32 passed | 2 skipped (34)
      Tests  606 passed | 2 skipped (608)
== frontend vitest (case status files)
 Test Files  23 passed (23)
      Tests  454 passed (454)
== frontend build
✓ built in 2.48s
== npm audit
found 0 vulnerabilities
== browser 006 Case Status parity
35 passed, 0 failed of 35
== browser 002 Services site
60 passed, 0 failed of 60
== browser 001 Court orders
23 passed, 0 failed of 23
== browser 005 Voice control
29 passed, 0 failed of 29
== browser 004 Workspace (PostgreSQL, throw-away database)
33 passed, 0 failed of 33
RUN_FINISHED 2026-10-29T16:06:12Z
```

Notes
- The "case status files" line runs the Case Status, Court Orders, Services-site and translation tests (23 files, 454 tests), the ones that bear on `docs/casestatus-parity.md`.
- The Case Status parity check also writes `docs/evidence/casestatus/casestatus-parity-results.json` (every check, with its result) and screenshots of each search tab, the results list and the case history.
- Speaking into a real microphone cannot be tested in headless Chrome; the voice checks type commands into the Alt+C box, which runs the same parser and page actions.
