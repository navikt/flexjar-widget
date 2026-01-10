# Flexjar Widget – AI Coding Guide

- **Mission**: ship a reusable Flexjar survey widget so NAV product teams can embed configurable forms and wire their
  own transport. Treat this repo as the future npm package source.

## Current Code

- **Entry point**: `packages/widget/src/index.ts` re-exports the dock, question components, hooks, and types.
- **Dock**: `components/FlexJarDock/FlexJarDock.tsx` exposes a sticky inline variant that keeps the survey on screen via
  the shared hook and question renderers. Always renders regardless of consent status.
- **Core logic**: `packages/widget/src/core/useFlexJar.ts` manages validation, submission lifecycle, and builds the
  Flexjar transport payload. All shared types live beside it in `core/types.ts`.
- **Questions**: rating, choice, and text renderers sit under `components/questions`. Keep the emoji UX accessible.
- **Styling**: relies on `@navikt/ds-react` tokens with CSS modules plus a bundled fallback stylesheet for emoji
  styling. Preserve NAV tokens, live-region feedback, and keep the fallback classes in sync with the module names.
- **Consent & storage**: Widget always renders. User consent only affects localStorage persistence via
  `consentStorage.ts` - with consent: dismissal persists; without consent: respects `initialOpen` on every page load.

## Target Architecture

- **Single package**: ship everything from `@navikt/flexjar-widget`. Keep React and `@navikt/ds-react` as peer
  dependencies while exposing the hook and types through the same entry point.
- **Styles export**: surface the compiled CSS at `@navikt/flexjar-widget/styles.css` so consuming apps can import the
  widget styles alongside `@navikt/ds-css` without poking at build internals.
- **Transport injection**: continue to require a `transport` implementation that receives
  `{ surveyId, answers, startedAt, submittedAt, transportPayload }` and returns a promise. Reflect loading, success,
  and error states via props/events.
- **Submission payload**: every submission now includes `question__<id>` entries containing the rendered prompt so
  downstream logs can pair answers with their questions. The rating answer must always resolve to `svar` and the main
  text to `feedback`; mirror those canonical keys (and their `question__svar`/`question__feedback` companions) in any
  transport changes.
- **Question schema**: maintain typed descriptors (rating/text/choice) and keep the rating question mandatory before
  revealing follow-ups.
- **Configurable copy**: accept all user-facing strings via props with sensible defaults. Avoid oppfølgingsplan-specific
  content.
- **Accessibility**: ensure dock semantics, focus management, and emoji button labelling stay intact while iterating.

## Workflow Expectations

- **Tooling**: build with `tsup`, test with Vitest + Testing Library, document UI via Storybook. Keep
  `npm run build|test|storybook` focused on the single workspace package.
- **CI/publishing**: this repo currently documents manual publishing to GitHub Packages in `CONTRIBUTING.md`.
  If you add CI later, include typecheck/lint/tests/build and publishing steps, but do not assume Changesets exist.
- **Testing focus**: unit-test the core hook, and cover React interactions with Testing Library for accessibility
  regressions.
- **Docs discipline**: README must always call out the required `@navikt/ds-css` and `@navikt/flexjar-widget/styles.css`
  imports, and highlight how to embed `FlexJarDock`.

## Refactor Checklist for Agents

- keep transport logic framework-agnostic inside `core/useFlexJar.ts` and expose it through the package entry.
- remove any lingering imports from historical oppfølgingsplan code whenever they surface.
- maintain accessibility: dock semantics, focus management, `aria-live` regions, and reachable emoji buttons are
  non-negotiable.
- update `README.md` with migration notes and examples when you land breaking API changes.
- keep the compiled CSS (`dist/index.css`) and exported `styles.css` subpath updated whenever you touch styling, and
  ensure fallback styles still match their CSS-module counterparts.
- ensure no follow-up question leaks the reserved `svar` or `feedback` keys; surface helpful warnings or docs when
  adjusting question-normalisation logic.
- this repo does not use Tailwind. Use CSS modules (and the existing Aksel tokens/primitives) for styling.

Questions or unclear areas? Surface gaps—especially around publishing strategy or API contracts—so we can expand these
instructions.

## Conventions

1. **Aksel Darkside**: Import `@navikt/ds-css/darkside` – uses `--ax-*` tokens
2. **Styling**: No Tailwind. Prefer Aksel primitives/props and CSS modules; keep fallback CSS in sync with module classnames.

## Related Repositories

- **[flexjar-analytics-api](https://github.com/navikt/flexjar-analytics-api)**: Backend API that consumes Flexjar submissions.
  Keep the widget transport payload compatible with backend expectations.

## Nav Principles

- **Team First**: Autonomous teams with circles of autonomy, supported by Architecture Advice Process
- **Product Development**: Continuous development and product-organized reuse over ad hoc approaches
- **Essential Complexity**: Focus on essential complexity, avoid accidental complexity
- **DORA Metrics**: Measure and improve team performance using DevOps Research and Assessment metrics

### Aksel Requirements

- **CRITICAL**: Always use Aksel spacing tokens, never Tailwind padding/margin
- Mobile-first with responsive props: `xs`, `sm`, `md`, `lg`, `xl`
- Norwegian number formatting with space separators

### Writing Effective Agents

Based
on [GitHub's analysis of 2,500+ repositories](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/),
follow these patterns when creating or updating agents in `.github/agents/`:

**Structure (in order):**

1. **Frontmatter** - Name and description in YAML
2. **Persona** - One sentence: who you are and what you specialize in
3. **Commands** - Executable commands early, with flags and expected output
4. **Related Agents** - Table of agents to delegate to
5. **Core Content** - Code examples over explanations (show, don't tell)
6. **Boundaries** - Three-tier system at the end

**Six Core Areas to Cover:**

- Commands (with flags and options)
- Testing patterns
- Project structure
- Code style (✅ Good / ❌ Bad examples)
- Git workflow
- Boundaries

**Three-Tier Boundaries:**

```markdown
## Boundaries

### ✅ Always

- Check if your code passes linting and type checks
- Verify that your code changes work as intended

### ⚠️ Ask First

- Modifying production configs
- Changing auth mechanisms

### 🚫 Never

- Commit secrets to git
- Skip input validation
```

**Key Principles:**

- **Commands early**: Put executable commands near the top, not buried at the bottom
- **Code over prose**: Show real code examples, not descriptions of what code should do
- **Actionable boundaries**: "Never commit secrets" not "I cannot access secrets"

---