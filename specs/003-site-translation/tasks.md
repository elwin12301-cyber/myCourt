---

description: "Task list for the translation of the eCourts Services site"
---

# Tasks: Translation of the eCourts Services Site

**Input**: `/specs/003-site-translation/` (spec.md, plan.md). **Tests**: INCLUDED (constitution Principle IV). Format: `[ID] [P?] [Story] Description` with repository-relative paths.

## Phase 1: Setup
- [x] T001 Run `npm test` and `npm run build`; record the baseline (234 tests)
- [x] T002 [P] Create `src/i18n/` and `src/i18n/strings/`

## Phase 2: Foundational
- [x] T003 [P] Write core tests `src/i18n/core.test.ts` (exact, template, params, fallback, misses, unknown language)
- [x] T004 Implement `src/i18n/core.ts` (languages, Row type, dictionary builder, translate with template matching, miss tracking)
- [x] T005 Implement `src/i18n/context.tsx` (I18nContext, useT, useLang, useFmt) and `src/i18n/index.ts` (dictionary from all strings)
- [x] T006 [P] Write `specs/003-site-translation/glossary.md` (agreed terms per language)
- [x] T007 [P] Dictionary quality tests `src/i18n/dictionary.test.ts` (five non-empty translations, same placeholders, correct script with a Latin allow-list, no duplicate keys)
- [x] T008 Make `fmt` language-aware in `src/pages/caseStatus/Results.tsx` and use locale month names (D9)
- [x] T009 Provide the language from `ServicesApp` (`initialLanguage` prop for tests), map label to code, set the page `lang`, replace the old notice with the machine-translation notice (D10, D11)

**Checkpoint**: infrastructure works with English and an empty dictionary.

## Phase 3: US1 - Whole site in my language (P1)
- [x] T010 [P] [US1] Render-completeness test `src/i18n/render.test.tsx`: every site page in all five translated languages with zero misses; English output unchanged
- [x] T011 [US1] Wrap and translate the shell and chrome: `ServicesApp.tsx`, `ExternalLink.tsx`, `DisplaySettings.tsx`, menus, footer, theme panel, notices (`strings/chrome.ts`)
- [x] T012 [US1] Wrap and translate shared forms: `form.tsx`, `Captcha.tsx`, `CaseStatus.tsx`, `CnrHome.tsx`, `MODES` help text (`strings/forms.ts`)
- [x] T013 [US1] Wrap and translate results and records: `Results.tsx`, `Detail.tsx`, `OrderResults.tsx`, `CourtOrders.tsx`, `CauseList.tsx`, order and cause-list labels (`strings/forms.ts`)
- [x] T014 [US1] Wrap and translate Caveat Search, Process Details, Location (`strings/services.ts`)
- [x] T015 [US1] Wrap and translate the information pages: High Courts, Contact, About, forms, help videos, newsletters, policies, screen readers, site map, site search (`strings/info.ts`)
- [x] T016 [US1] Message tests `src/i18n/data.test.ts` and `src/i18n/behaviour.test.tsx`: every validator message in every language, with values inserted correctly
- [x] T017 [US1] Translate validation messages as templates (`strings/messages.ts`)

## Phase 4: US2 - Machine-translation notice (P1)
- [x] T018 [P] [US2] Notice tests in `src/i18n/behaviour.test.tsx`: present in both languages for each non-English language, absent in English
- [x] T019 [US2] Finalise the notice text in all five languages (`strings/chrome.ts`)

## Phase 5: US3 - Dates, states and terms (P2)
- [x] T020 [P] [US3] Tests `src/i18n/behaviour.test.tsx`: 36 states, case types, acts, 25 High Courts translated; option values stay English; search results identical across languages
- [x] T021 [US3] Translate names in `strings/names.ts` and display them with `t()` while keeping stored values English (D7, D8)

## Phase 6: US4 - Layout and assistive technology (P2)
- [x] T022 [US4] Extend `specs/002-services-site-prototype/browser-check.mjs` with a language pass: every language, every page, 360 px overflow, the notice, `lang` attribute, persistence, search parity
- [x] T023 [US4] Fix any layout problems found (long Indic text) in `src/styles.css`

## Phase 7: Polish
- [x] T024 [P] Update `docs/` (gap analysis, prototype guide), `README.md`, and `specs/003-site-translation/validation-log.md`
- [x] T025 Run the browser check in all six languages and record results
- [x] T026 Run `npm test` and `npm run build`
- [x] T027 Re-check Principles I-V and record it

## Dependencies
Setup, then Foundational (blocks everything), then US1 (T010 first, then T011 to T017), US2, US3, US4, Polish. T011 to T015 each add rows to a different strings file, so their text can be written separately, but they all edit shared components and are run in order. T016 needs T017's messages to exist.

## MVP
Setup, Foundational and US1 plus US2: the whole site translated, with the honest notice.

## Notes
Out of scope: native-speaker review (not available; documented), the workspace outside the services site, translating fictional records, speech.
