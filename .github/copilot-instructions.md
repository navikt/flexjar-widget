# Flexjar Widget – AI Coding Guide

- **Mission**: ship a reusable Flexjar survey widget so NAV product teams can embed configurable forms and wire their own transport. Treat this repo as the future npm package source.

## Current Code (to refactor)
- **Entry point**: `flexjar/FlexJarModal.tsx` controls modal, `react-hook-form`, emojis, and submission via `useOpprettFlexjarFeedback`.
- **Form pattern**: `FlexJarModal` wraps children with `FormProvider`; nested questions (e.g. `FlexJarTextAreaQuestion`) must use `useFormContext`.
- **Rating UX**: `emoji/EmoQuestion.tsx` tracks 1–5 rating in local state. Keep rating mandatory before showing follow-up questions.
- **Hardwired APIs**: `queryhooks/useOpprettFlexjarFeedback.ts` posts with helpers imported from `oppfolgingsplan-frontend`; remove those dependencies when extracting.
- **Styling**: mix of `@navikt/ds-react` components, Tailwind utility classes, and CSS modules (`emoji/emo.module.css`). Keep NAV design tokens and `aria-live` success messaging in `TakkForTilbakemeldingen`.

## Target Architecture
- **Split packages**: plan for a workspace with `flexjar-core` (types, hooks, validation) and `flexjar-react` (Aksel-based UI). React and DS remain peer dependencies.
- **Transport injection**: eliminate direct HTTP calls. Expose an `onSubmit`/`transport` prop that receives `{ feedbackId, answers, metadata }` and returns a promise. Surface loading, validation, and error states via props/events.
- **Question schema**: define typed descriptors (rating/text/choice) in core, render them in the React package. Default questions should be data-driven rather than hardcoded copy.
- **Configurable copy**: accept all user-facing text (intro, labels, warnings, success) via props with sensible defaults. Avoid embedding oppfølgingsplan-specific content.
- **State separation**: keep UI-only state (modal open, selected rating) in React package while submission lifecycle lives in core hook (`useFlexJar`).

## Workflow Expectations
- **Tooling**: repository currently lacks build/test setup. Align on workspace root `package.json`, `tsconfig` per package, bundler (`tsup`/`vite`), Storybook for `flexjar-react`, and linting (ESLint + Prettier).
- **CI/publishing**: aim for Changesets + GitHub Actions running typecheck, test, build, and publish to GitHub Packages. Document the release flow once scripts exist.
- **Testing focus**: core package should get unit/validation tests (Vitest), React package should use Testing Library for accessibility and interaction. No test framework is present yet—add when scaffolding packages.

## Refactor Checklist for Agents
- Extract types and submission hook into a framework-agnostic `flexjar-core` module.
- Rebuild `FlexJarModal` in `flexjar-react` to consume the core hook and accept injected transport/copy/questions.
- Remove all imports pointing at `../../oppfolgingsplan-frontend` and replace with local abstractions or peer requirements.
- Maintain accessibility: keep `Modal` semantics, keyboard focus management, `aria-live` regions, and ensure emoji buttons remain reachable.
- Provide migration docs and examples (e.g., how oppfølgingsplan configures questions and transport) in `README.md` when ready.

Questions or unclear areas? Surface gaps—especially around publishing strategy or API contracts—so we can expand these instructions.
