# Changelog

All notable changes to `@navikt/flexjar-widget` will be documented in this file.

## [Unreleased]

- Add entries here before cutting the next release.

## [0.2.12] - 2025-10-29

### Fixed
- **localStorage persistence now properly respects consent**
  - Fixed issue where widget persisted to localStorage even when consent was not granted
  - Added consent check in `consentStorage.ts` to verify surveys consent before enabling persistence
  - Widget now correctly skips localStorage when user hasn't granted surveys consent
  
- **Fixed flash of content during dock initialization**
  - Added loading state (`isLoading`) to `usePersistedDismissal` hook
  - Dock now waits for localStorage check to complete before rendering
  - Eliminates brief flash where dock appeared and then immediately hid

### Changed
- **Widget now always renders regardless of consent status**
  - Removed consent gating that prevented widget rendering when surveys consent was not granted
  - Widget now displays for all users, with localStorage persistence controlled by consent:
    - **With consent**: localStorage persistence works (dismissal state persists across page reloads)
    - **Without consent**: No localStorage persistence (widget respects `initialOpen` on every page load)
  - This allows feedback collection from all users while respecting their storage preferences
  - Removed `useConsentCheck` hook from render path since it's no longer needed for gating

### Removed
- **Removed blue X close button from dock**
  - Deleted `CloseButton` component entirely per designer request
  - Users can now only close the dock using the "Avbryt" button within the form
  - This simplifies the UI and ensures consistent close behavior

### Changed
- **Updated test to find cancel button by role instead of label**
  - Changed test selector from `getByLabelText` to `getByRole("button", { name: /avbryt/i })`
  - Ensures tests work with new button-only close mechanism

## [0.2.11] - 2025-10-29

### Fixed
- **Improved error messaging for storage persistence**
  - Clarified error message when storage key is not in NAV's allowed list
  - Removed misleading "or user has not given surveys consent" text (consent is already verified before this check)
  - Error now clearly states: "Storage key not in NAV's allowed storage list" with instructions to contact NAV
  
### Changed
- **Type definitions aligned with official nav-dekoratoren-moduler API**
  - Changed `getCurrentConsent()` from async (`Promise<Consent>`) to synchronous (`Consent`) to match official implementation
  - Made all `Consent` properties required (not optional) to match official types
  - Added `Storage` type and `getAllowedStorage()` function to type definitions
  - Updated all mocks and tests to use synchronous `getCurrentConsent()`
- **Updated documentation**
  - Clarified two-step requirement for persistence: user consent AND NAV storage allowlist
  - Added clear instructions that `flexjar-*` pattern must be added to decorator's allowed storage configuration
  - Explained fallback behavior when storage key is not allowed (no persistence, reopens on page reload)

## [0.2.10] - 2025-10-29

### Fixed
- **Critical: Fixed consent API structure mismatch**
  - Corrected `getCurrentConsent()` to access nested `consent.surveys` property instead of top-level `surveys`
  - Real API returns `{ consent: { surveys, statistics }, userActionTaken, meta }`, not flat `{ surveys, statistics }`
  - Updated type definitions to match actual nav-dekoratoren-moduler v1.6.0+ API structure
  - Fixed Storybook mock to return correct nested structure for realistic testing
  - Updated all test mocks to use proper API response format
- **Critical: Fixed hooks violation error** in consent checking implementation
  - Moved consent check to occur after all hooks are called, resolving "Rendered more hooks than during the previous render" error
  - Widget now properly follows React's Rules of Hooks, ensuring stable hook order across all renders
  - Consent check conditional return now happens after all hooks (useFlexJar, usePersistedDismissal, useRatingGate, etc.) are invoked
- **Storybook improvements**: 
  - Added mock consent module that uses localStorage for realistic testing
  - Added three interactive buttons: "Nullstill docken" (reset), "Gi samtykke" (grant consent), "Fjern samtykke" (revoke consent)
  - Live consent status indicator shows current state with visual feedback
  - Properly typed `window.__FLEXJAR_MOCK_CONSENT__` API to resolve TypeScript linting errors
  - Mock module listens for custom `__flexjar_consent_change__` events for same-window updates

### Changed
- Consent checking now accesses `consent?.consent?.surveys` instead of `consent?.surveys`
- Consent checking now happens after all other hooks to maintain consistent hook execution order
- Storybook mock consent state persists in localStorage (`__flexjar_storybook_consent__`) for more realistic behavior

## [0.2.9] - 2025-10-29

### Added
- **Consent checking**: Widget now automatically checks for user consent via `@navikt/nav-dekoratoren-moduler`'s `getCurrentConsent()` API before rendering
  - Returns `null` (renders nothing) if the user has not granted surveys consent or has declined
  - Returns `null` while checking consent status (loading state)
  - Only renders when user has explicitly granted surveys consent
  - Ensures compliance with NAV's privacy requirements: nothing related to the survey is sent from the client without user consent
- New `useConsentCheck` hook to handle consent checking logic
- Comprehensive test coverage for consent checking behavior (5 new test cases)

### Changed
- Widget requires `@navikt/nav-dekoratoren-moduler` v1.6.0 or later for consent checking
- Updated README with consent checking documentation and installation requirements

## [0.2.8] - 2025-10-29

### Added
- New `hideAfterSubmit` prop (defaults to `true`) to control dock behavior after successful submission:
  - `true` (default): Dock completely disappears with no minimized button, and stays hidden across page reloads for the full cooldown period
  - `false`: Dock minimizes to a small button that can be reopened
- Persist the `hideCompletely` flag in localStorage so the hiding behavior survives page reloads
- Add new Storybook example "Hide After Submit" demonstrating the complete hiding behavior
- Comprehensive JSDoc documentation for all `FlexJarDockProps` to improve discoverability and IDE support

### Changed
- Updated `usePersistedDismissal` hook to track and persist `shouldHideCompletely` state
- `closeDock()` now accepts an optional `hideCompletely` parameter to control the dismissal behavior
- Close button is now conditionally hidden on the success screen
- Refactored dismissal logic to use persistent state instead of refs for more reliable behavior across sessions
- **BREAKING**: `hideAfterSubmit` now defaults to `true` (complete hiding) instead of `false` (minimized). Set explicitly to `false` if you want the old minimized behavior.

### Removed
- **BREAKING**: Removed `title` prop - the dock now uses a hardcoded "Gi tilbakemelding" label for accessibility and minimized button fallback. This simplifies the API and reduces configuration overhead.
- **BREAKING**: Removed `renderQuestion` prop - the dock now only uses the built-in question renderer. This ensures consistent UX across all NAV feedback widgets and simplifies the API. All question customization should be done through the survey configuration (prompts, descriptions, options, etc.).
- Removed `FlexJarRenderQuestionProps` from public API exports (no longer needed without `renderQuestion` prop).

## [0.2.7] - 2025-10-29

### Added
- New `hideAfterSubmit` prop to control dock behavior after successful submission:
  - `false` (default): Dock minimizes to a small button that can be reopened
  - `true`: Dock completely disappears with no minimized button, and stays hidden across page reloads for the full cooldown period
- Persist the `hideCompletely` flag in localStorage so the hiding behavior survives page reloads
- Add new Storybook example "Hide After Submit" demonstrating the complete hiding behavior

## [0.2.6] - 2025-10-28

- Export missing survey-related types (`FlexJarSurveyConfig`, `FlexJarRatingQuestion`, `FlexJarMainQuestion`, `FlexJarFollowUpQuestion`) from the package entry point to match the documented API in README.

## [0.2.5] - 2025-10-28

- Fix close button styling specificity issue by using doubled class selectors (`.flexjar-dock__close-button.flexjar-dock__close-button`) instead of `!important` to properly override NAV Design System's `.navds-button` styles in consuming applications.

## [0.2.4] - 2025-10-28

- Migrate all color tokens from global palette tokens (e.g., `--a-red-500`, `--a-green-700`) to semantic design tokens (e.g., `--a-text-danger`, `--a-icon-success`) for better consistency with the NAV Aksel design system and improved theming support.
- Enhance visual distinction between "glad" (rating 4) and "veldig glad" (rating 5) emoji buttons by using `--a-surface-success-moderate` and `--a-text-success` for the highest rating, with a darker hover state via `filter: brightness(0.8)`.
- Add `React.memo` optimization to `CloseButton` and `SuccessContent` components to reduce unnecessary re-renders and improve overall performance.
- Remove duplicate component files (`MinimizedDock.tsx`, `SuccessContent.tsx`, `usePersistedDismissal.ts`, `useRatingGate.ts`, `useAutoCloseOnSuccess.ts`) to streamline the codebase and improve maintainability.

## [0.2.3] - 2025-10-28

- Improve styling for the CloseButton in `FlexJarDock` to ensure proper alignment and appearance.

## [0.2.2] - 2025-10-27

- Remove memory fallback storage to ensure consent compliance—dock now uses `initialOpen` behavior when consent is
  unavailable or denied.
- Update storage key format from `flexjar-dock-dismissed:${feedbackId}` to `flexjar-dismissed-${feedbackId}` for
  consistency with NAV's allowed storage list.
- Add comprehensive development logging to help diagnose consent storage availability and permission status.
- Document the consent-dependent persistence behavior in README, clarifying that `flexjar-*` keys must be in the allowed
  storage list for cross-session persistence.
- Refine `writeConsentValue` to return `allowed: false` when storage is unavailable, ensuring `onDismissalPersistFailed`
  fires correctly.

## [0.2.1] - 2025-10-27

- Persist dock dismissals via `@navikt/nav-dekoratoren-moduler` storage, adding the `dismissCooldownDays` option and
  `minimizedButtonLabel` override for the minimized reopen button.
- Refactor `FlexJarDock` into smaller hooks and subcomponents for easier maintenance while restoring the close-button
  icon that regressed during the restructuring.
- Relax the `@navikt/nav-dekoratoren-moduler` peer requirement to `>=1.6.0` (from an unpublished 3.x range) so
  `npm install` succeeds without pointing at a non-existent version.

## [0.2.0] - 2025-10-24

- Remove the `FlexJarModal` and `FlexJarGuidePanel` entry points so the package ships a dock-only UI.
- Localise the dock success layout and auto-close hooks instead of importing them from the deleted modal module.
- Rename the `FlexJarEvents.onViewModal` callback to `onViewDock` and update the dock implementation/tests to use the
  new event.
- Rewrite the README and Copilot instructions around the dock-centric API, including updated prop documentation.
- Bump the npm package version to 0.2.0 to signal the breaking API change.

## [0.1.12] - 2025-10-22

- Replace the Dock rating styles to avoid CSS Modules `:global` selectors so `@navikt/flexjar-widget/styles.css` works
  in host apps that don’t process CSS Modules.
- Align the fallback stylesheet and Dock renderer with the new class names to keep the rating field spacing and legend
  hiding intact.

## [0.1.11] - 2025-10-21

- Drop the unused `initialOpen`, `triggerLabel`, and `triggerAriaLabel` props from `FlexJarDock` so the API reflects the
  current always-on dock design.
- Warn during development when follow-up question ids collide with the reserved `svar`/`feedback` keys so hidden
  questions are easier to debug.
- Surface dock dismissal persistence failures through a new `events.onDismissalPersistFailed` callback and document the
  `sessionStorage` fallback behaviour.
- Remove the default success body copy so the confirmation screen only shows the title unless you supply custom
  messaging.

## [0.1.10] - 2025-10-20

- Rebuild the published bundle so the optional `mainQuestion` requirement ships in the npm package, ensuring
  `required: false` works outside Storybook.
- Add a Storybook variant demonstrating an optional main question to verify the validation behaviour interactively.

## [0.1.9] - 2025-10-20

- Respect `mainQuestion.required`, allowing teams to mark the main survey question as optional while still mapping
  answers to the canonical `feedback` key when provided.
- Document the optional-main-question behaviour so consumers know how to disable the default requirement without
  breaking the transport payload.

## [0.1.8] - 2025-10-16

- Restore the white (`surface-default`) default panel background for `FlexJarDock` while keeping the `panelBackground`
  override for custom tokens.
- Drop the duplicate validation warning banners in the dock and modal so individual questions surface their own error
  messaging.

## [0.1.7] - 2025-10-16

- Improve `FlexJarDock` contrast on white surfaces by switching the default panel to the NAV `surface-subtle`/
  `border-subtle` tokens and exposing `panelBackground` / `panelBorderColor` overrides for further tuning.
- Document the new dock styling props and expand the README survey examples with the single-choice variant used in
  Storybook.

## [0.1.6] - 2025-10-16

- Keep `FlexJarDock` open by default and remember dismissals in `sessionStorage`, so users only see the panel once per
  session unless you opt out with `initialOpen={false}`.
- Allow the main survey question to be defined as either free text or a single-choice list while still mapping the
  answer to the canonical `feedback` transport key.
- Refresh Storybook with a reset helper for the dock dismissal flag and add new examples covering the single-choice main
  question.
- Rework the README to spotlight the dock as the primary integration and tuck the alternative entry points into a
  collapsible section alongside restored installation guidance.

## [0.1.5] - 2025-10-14

- Include question prompts in the transport payload using `question__<id>` keys so Flexjar logs can pair answers with
  their human-readable questions.
- Normalise rating and main question answers to the canonical Flexjar keys (`svar`/`feedback`) while preserving question
  metadata for analytics.

## [0.1.4] - 2025-10-13

- Expose `@navikt/flexjar-widget/styles.css` so consumers can import the compiled widget stylesheet without poking at
  internal build paths.

## [0.1.3] - 2025-10-13

- Refine rating layout spacing so emoji buttons stay on two rows on mobile while remaining left aligned on larger
  screens.

## [0.1.2] - 2025-10-13

- Fix rating question styling when CSS modules are not processed by the consuming build.
- Add a `width` prop to `FlexJarModal`, now defaulting to the Aksel `"large"` preset while still allowing custom modal
  widths.
- Introduce `FlexJarGuidePanel` for a plug-and-play `GuidePanel` + CTA that opens the modal automatically.
- Document the recommended `survey.ts` + `Flexjar.tsx` setup and refresh Storybook with a guide-panel example.

## [0.1.1] - 2025-10-13

- Prepare the widget package for the first GitHub Packages publish with consolidated exports and release documentation.

