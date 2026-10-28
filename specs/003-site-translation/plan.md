# Implementation Plan: Translation of the eCourts Services Site

**Branch**: `003-site-translation` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Scope note**: one file, like feature 002. Decisions, data model, test plan and the validation guide are folded in below.

## Summary

Add a small translation layer with no new dependency. English text is the key. A language context supplies a `t()` function to every component of the services site. Dictionaries hold one row per English text with five translations, written as typed tuples so a missing language is a compile error. Validation messages produced by existing pure functions are translated by matching them against template rows, so those functions and their tests do not change.

## Technical Context

**Language/Version**: TypeScript 5.6 strict, React 18 (existing). **Primary Dependencies**: none new. **Storage**: existing site preferences (language already stored). **Testing**: Vitest (completeness, placeholders, script, templates, render in every language) plus the Chrome DevTools browser check run in every language. **Constraints**: no new dependency; English output byte-identical to today; layout at 360 px; honest machine-translation labelling.

## Constitution Check

| Principle | Gate | Result |
|---|---|---|
| I Demonstration data never presented as real | Records stay as data; translation notice says unreviewed; English authoritative | PASS |
| II Advocate review before reliance | Notice tells users to rely on the English text and to have legal wording reviewed | PASS |
| III Accessible and responsive | Page language declared; 360 px checked in every language; labels translated for assistive technology | PASS (verify) |
| IV Tested, type-safe | Typed rows; completeness, placeholder, script and render tests; browser check per language | PASS (planned) |
| V Confidentiality and secure integration | No data leaves the browser; no external translation service is called | PASS |

## Design decisions

- **D1 English text as the key.** `t('Search this site')`. Keeps call sites readable and makes the English fallback trivial. A key renamed in code without a dictionary update is caught by the missing-key test.
- **D2 Typed rows.** `[en, hi, mr, gu, kn, ta]` tuples in files per area (`chrome`, `forms`, `messages`, `services`, `info`, `names`). The tuple type forces all five languages (FR-010, SC-001).
- **D3 Placeholders.** Named, for example `Search results · {n} of {m} orders`. Counts use two rows (`{n} result`, `{n} results`) chosen in code, avoiding plural rules.
- **D4 Validation messages stay in the validators.** They return finished English sentences. `t()` first tries an exact row, then template rows (a row containing `{name}` becomes a pattern), extracting the values and re-inserting them into the translation. No validator or validator test changes.
- **D5 Language context, not a global.** `I18nContext` with `{ lang, t }`; the default is English, so the workspace is unaffected (FR-014). `ServicesApp` provides it from the stored preference.
- **D6 Missing text.** `t()` returns English and records the miss in a set; tests render every page in every language and assert the set is empty.
- **D7 Displayed text vs stored value.** `<option value={english}>{t(english)}</option>` so searches and filters use English values (FR-004).
- **D8 Names.** 36 states/UTs, 5 case types, 6 acts, 25 High Court names, forms, help videos and newsletters are translated rows in `names.ts` / `info.ts`; person and court names in fixtures are not.
- **D9 Dates.** `fmt(iso, lang)` with `toLocaleDateString(locale)`; locales `hi-IN mr-IN gu-IN kn-IN ta-IN`.
- **D10 Notice.** Shown by the shell for non-English languages in two paragraphs: the language and English (FR-007). Replaces the old "translation not available" notice.
- **D11 Page language.** `document.documentElement.lang` is set while the site is shown and restored on leaving (FR-009).
- **D12 Quality controls.** Automated: completeness, no empty rows, same placeholders, correct Unicode script (Devanagari for hi/mr, Gujarati, Kannada, Tamil) with an allow-list of Latin terms. Human: documented glossary and a review list; nobody has reviewed yet.
- **D13 Language codes.** The stored preference stays the native label already used by the selector; a map converts it to a code. Unknown values fall back to English.

## Data model (summary)

`Row = [en, hi, mr, gu, kn, ta]`; `Dictionary { exact: Map<string, Record<Lang, string>>, templates: { pattern: RegExp, names: string[], row }[] }`; `TFn = (text: string, params?: Record<string, string | number>) => string`.

## Project Structure

```text
specs/003-site-translation/           spec.md, plan.md, tasks.md, glossary.md, validation-log.md
src/i18n/
  core.ts            languages, row type, dictionary builder, translate(), miss tracking
  context.tsx        I18nContext, useT(), useLang(), useFmt()
  strings/           chrome.ts forms.ts messages.ts services.ts info.ts names.ts
  index.ts           builds the dictionary from all rows
src/features/.../*.test.ts(x)         i18n tests; existing tests unchanged
src/pages, src/components, src/features   CHANGE  wrap interface text with t()
```

## Test plan

1. Core unit tests: exact lookup, template match with several placeholders, params, English fallback and miss tracking, unknown language.
2. Dictionary quality: every row has five non-empty translations; same placeholder names as English; correct script per language (Latin allow-list); no duplicate English keys.
3. Render completeness: every site page, and page states that can be rendered without input, in all six languages, with zero misses.
4. Message completeness: every validator error message produced by invalid inputs has a template or exact row in all languages.
5. Browser check in each language: pages open, notice present, no horizontal scroll at 360 px, language persists, `lang` attribute set, search results equal English.

## Complexity Tracking

No violations.
