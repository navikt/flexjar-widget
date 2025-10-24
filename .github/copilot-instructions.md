# Flexjar Widget – AI Coding Guide

- **Mission**: ship a reusable Flexjar survey widget so NAV product teams can embed configurable forms and wire their own transport. Treat this repo as the future npm package source.

## Current Code
- **Entry point**: `packages/widget/src/index.ts` re-exports the dock, question components, hooks, and types.
- **Dock**: `components/FlexJarDock/FlexJarDock.tsx` exposes a sticky inline variant that keeps the survey on screen via the shared hook and question renderers.
- **Core logic**: `packages/widget/src/core/useFlexJar.ts` manages validation, submission lifecycle, and builds the Flexjar transport payload. All shared types live beside it in `core/types.ts`.
- **Questions**: rating, choice, and text renderers sit under `components/questions`. Keep the emoji UX accessible.
- **Styling**: relies on `@navikt/ds-react` tokens with CSS modules plus a bundled fallback stylesheet for emoji styling. Preserve NAV tokens, live-region feedback, and keep the fallback classes in sync with the module names.

## Target Architecture
- **Single package**: ship everything from `@navikt/flexjar-widget`. Keep React and `@navikt/ds-react` as peer dependencies while exposing the hook and types through the same entry point.
- **Styles export**: surface the compiled CSS at `@navikt/flexjar-widget/styles.css` so consuming apps can import the widget styles alongside `@navikt/ds-css` without poking at build internals.
- **Transport injection**: continue to require a `transport` implementation that receives `{ feedbackId, answers, startedAt, submittedAt, transportPayload }` and returns a promise. Reflect loading, success, and error states via props/events.
- **Submission payload**: every submission now includes `question__<id>` entries containing the rendered prompt so downstream logs can pair answers with their questions. The rating answer must always resolve to `svar` and the main text to `feedback`; mirror those canonical keys (and their `question__svar`/`question__feedback` companions) in any transport changes.
- **Question schema**: maintain typed descriptors (rating/text/choice) and keep the rating question mandatory before revealing follow-ups.
- **Configurable copy**: accept all user-facing strings via props with sensible defaults. Avoid oppfølgingsplan-specific content.
- **Accessibility**: ensure dock semantics, focus management, and emoji button labelling stay intact while iterating.

## Workflow Expectations
- **Tooling**: build with `tsup`, test with Vitest + Testing Library, document UI via Storybook. Keep `npm run build|test|storybook` focused on the single workspace package.
- **CI/publishing**: plan for Changesets + GitHub Actions covering typecheck, tests, build, and publishing to GitHub Packages. Document the release flow when scripts exist.
- **Testing focus**: unit-test the core hook, and cover React interactions with Testing Library for accessibility regressions.
- **Docs discipline**: README must always call out the required `@navikt/ds-css` and `@navikt/flexjar-widget/styles.css` imports, and highlight how to embed `FlexJarDock`.

## Refactor Checklist for Agents
- keep transport logic framework-agnostic inside `core/useFlexJar.ts` and expose it through the package entry.
- remove any lingering imports from historical oppfølgingsplan code whenever they surface.
- maintain accessibility: dock semantics, focus management, `aria-live` regions, and reachable emoji buttons are non-negotiable.
- update `README.md` with migration notes and examples when you land breaking API changes.
- keep the compiled CSS (`dist/index.css`) and exported `styles.css` subpath updated whenever you touch styling, and ensure fallback styles still match their CSS-module counterparts.
- ensure no follow-up question leaks the reserved `svar` or `feedback` keys; surface helpful warnings or docs when adjusting question-normalisation logic.

Questions or unclear areas? Surface gaps—especially around publishing strategy or API contracts—so we can expand these instructions.
