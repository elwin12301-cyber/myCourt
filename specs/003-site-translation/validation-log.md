# Validation log: Translation of the eCourts Services Site

Run on 2026-10-28 against the dev server after all tasks were implemented.

## Automated checks
| Check | Result |
|---|---|
| `npm test` | 490 tests in 26 files passing, 1 skipped (234 before this feature, 256 new) |
| `npx tsc -b` | no errors |
| `npm run build` | type-check and production build succeed |

New tests cover:
- **Core** (`core.test.ts`): exact lookup, templates with inserted values, nested translation of inserted values, English fallback, miss tracking, text without Latin letters left alone, unknown language.
- **Dictionary quality** (`dictionary.test.ts`): no duplicate English keys, five non-empty translations per row, the same placeholders in every language, each translation in the right script, no stray Latin words except the allow-list (`ALLOWED_LATIN`).
- **Completeness** (`render.test.tsx`): all 21 site pages in all 5 languages (105 renders) record zero missing translations and leave no English word on the page (apart from the allow-list, the English line of the notice, URLs and e-mail forms); English output is unchanged and shows no notice.
- **After a search or an error** (`data.test.ts`): every validation message, state, case type, act, police station, demo record, process and caveat text is translated in every language.
- **Behaviour** (`behaviour.test.tsx`): numbers and inserted words survive translation; the machine-translation notice appears in both the language and English; 36 states, case types, acts and 25 High Court names are translated; option values on the search form stay English.

## Browser check
Method: headless Google Chrome driven through the DevTools protocol by `specs/002-services-site-prototype/browser-check.mjs`, measured at 360 px without phone emulation. Result: **60 of 60 checks passed** (44 earlier checks plus 16 for translation). The Court Orders check (`specs/001-court-orders`) still passes 23 of 23.

| Check | Hindi | Marathi | Gujarati | Kannada | Tamil |
|---|---|---|---|---|---|
| `lang` attribute, notice and translated heading | pass | pass | pass | pass | pass |
| No horizontal scroll on all 21 pages at 360 px | pass | pass | pass | pass | pass (after fix) |
| CNR search still finds the record (values stay English) | pass | pass | pass | pass | pass |

Also checked: the language choice persists after reload (`lang` and the selector); switching back to English removes the notice and restores `lang="en"`.

### Defect found and fixed
Tamil on the High Courts page overflowed by 36 px at 360 px: a long translated name plus its button could not wrap in a list row. Fixed in `src/styles.css` (`.listrow` may wrap and its children may shrink and break long words). All five languages then passed.

## Corrections made while building
- The earlier "translation is not available" notice (spec 002, journeys J6 and J7) was replaced; those checks now assert the translated page and the machine-translation notice.
- A random captcha put random Latin letters on the page and made the English-word scan unreliable; the render tests now fix the captcha.
- The police-station options were not wrapped for translation; found by a review of raw `<option>` elements and fixed.
- A tooling mistake wrote a backspace character into a test regex; found by the failing test and fixed.

## Not done
- **Native-speaker review.** None was available. Every translation is machine-assisted and unreviewed. The site says so on every translated page, in the language and in English. `glossary.md` lists the choices a reviewer should check first.
- **Fictional records** (names, case numbers) stay in English by design.
- **The workspace** outside the services site stays English.

## Constitution check
- **I Demo data never real**: unchanged; translated demo banners still say the data is fictional and unconnected to eCourts.
- **II Advocate review**: the notice states the translation is unreviewed and that English is authoritative; no legal advice is added.
- **III Accessible and responsive**: `lang` is set while the site is shown; the English line in the notice is marked `lang="en"`; layout holds at 360 px in every language.
- **IV Tested and type-safe**: 256 new tests; strict TypeScript clean; the row type forces all five translations.
- **V Confidentiality and secure integration**: no new network calls, storage or dependencies; the e-mail on Process Details is still never stored or repeated.
