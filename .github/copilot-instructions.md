# Flexjar Widget – AI Coding Guide

Reusable NAV survey widget published as `@navikt/flexjar-widget` on GitHub Packages.

## Architecture

```
packages/widget/src/
├── index.ts              # Package entry - re-exports all public API
├── core/                 # Framework-agnostic logic
│   ├── useFlexJar.ts     # Main hook: validation, submission lifecycle
│   ├── types.ts          # FlexJarQuestion, FlexJarTransport, FlexJarSubmission
│   ├── validation.ts     # Answer validation per question type
│   └── transportPayload.ts # Builds canonical payload with reserved keys
└── components/
    ├── FlexJarDock/      # Primary UI: sticky survey panel
    │   ├── hooks/        # useRatingGate, usePersistedDismissal
    │   └── components/   # DockPanel, MinimizedDock
    ├── questions/        # Rating, Text, Choice renderers
    ├── shared/
    │   ├── canonicalSurvey.ts  # Normalizes survey config → internal format
    │   └── consentStorage.ts   # NAV dekoratør consent-aware localStorage
    └── surveyTypes.ts    # FlexJarSurveyConfig (user-facing schema)
```

### Key Concepts
- **Transport injection**: Consumer provides `transport.submit(submission)` promise. Widget handles loading/success/error states.
- **Reserved payload keys**: Rating → `svar` (number), main text → `feedback` (string). Follow-up questions must NOT use these IDs.
- **Consent-aware persistence**: Dismissal persists to localStorage only with NAV surveys consent via `@navikt/nav-dekoratoren-moduler`. Without consent, respects `initialOpen` on each page load.
- **Rating gate**: Follow-up questions only reveal after rating is answered.

## Commands
```sh
npm run build        # tsup → dist/index.js + dist/index.css
npm run test         # Vitest + Testing Library
npm run storybook    # Dev at localhost:6006
npm run lint         # ESLint (root)
```

## Styling
- Uses `@navikt/ds-react` Aksel Darkside tokens (`--ax-*` prefix)
- CSS Modules (`*.module.css`) + fallback stylesheet (`*.fallback.css`)
- **Keep fallback classes in sync** with module class names for non-module consumers
- Consumers import: `@navikt/ds-css/darkside` then `@navikt/flexjar-widget/styles.css`

## Testing Patterns
- Core hook tests: `core/__tests__/useFlexJar.test.ts` – uses `renderHook`, fake timers
- Consent mocking: Vitest aliases `@navikt/nav-dekoratoren-moduler` → `.storybook/mocks/consentMock.ts`
- Storybook a11y addon for accessibility testing

## Conventions
1. **Export paths**: Only `./dist/index.js` (ESM) and `./styles.css` subpath
2. **Peer deps**: React ≥18, `@navikt/ds-react` ≥7, `@navikt/ds-css` ≥7
3. **Question IDs**: Use `analyticsId` for tracking; `id` gets normalized to `svar`/`feedback` for core questions
4. **Event callbacks**: `FlexJarEvents` for analytics hooks (onViewDock, onSubmitSuccess, etc.)
5. **Props naming**: All user-facing strings configurable with `*Label`, `*Message` props

## Related Repositories
- **[flexjar-analytics-api](https://github.com/navikt/flexjar-analytics-api)**: Backend that receives submissions. Widget's `transportPayload` must include `svar` (rating) and `feedback` (text) keys.
- **[flexjar-analytics](https://github.com/navikt/flexjar-analytics)**: Dashboard for viewing submissions. Types should stay in sync with `lib/api.ts`.

## Checklist for Changes
- [ ] Run `npm run build && npm run test` before committing
- [ ] Update `CHANGELOG.md` under `[Unreleased]` for any user-facing changes
- [ ] Keep `README.md` examples current when changing props/API
- [ ] Verify Storybook stories cover new props/states
- [ ] Fallback CSS must mirror any CSS Module changes
- [ ] Reserved keys `svar`/`feedback` must not leak to follow-up question IDs
