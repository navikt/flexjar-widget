# Changelog

All notable changes to `@navikt/flexjar-widget` will be documented in this file.

## [Unreleased]
- Drop the unused `initialOpen`, `triggerLabel`, and `triggerAriaLabel` props from `FlexJarDock` so the API reflects the current always-on dock design.
- Warn during development when follow-up question ids collide with the reserved `svar`/`feedback` keys so hidden questions are easier to debug.
- Surface dock dismissal persistence failures through a new `events.onDismissalPersistFailed` callback and document the `sessionStorage` fallback behaviour.
- Remove the default success body copy so the confirmation screen only shows the title unless you supply custom messaging.

## [0.1.10] - 2025-10-20
- Rebuild the published bundle so the optional `mainQuestion` requirement ships in the npm package, ensuring `required: false` works outside Storybook.
- Add a Storybook variant demonstrating an optional main question to verify the validation behaviour interactively.

## [0.1.9] - 2025-10-20
- Respect `mainQuestion.required`, allowing teams to mark the main survey question as optional while still mapping answers to the canonical `feedback` key when provided.
- Document the optional-main-question behaviour so consumers know how to disable the default requirement without breaking the transport payload.

## [0.1.8] - 2025-10-16
- Restore the white (`surface-default`) default panel background for `FlexJarDock` while keeping the `panelBackground` override for custom tokens.
- Drop the duplicate validation warning banners in the dock and modal so individual questions surface their own error messaging.

## [0.1.7] - 2025-10-16
- Improve `FlexJarDock` contrast on white surfaces by switching the default panel to the NAV `surface-subtle`/`border-subtle` tokens and exposing `panelBackground` / `panelBorderColor` overrides for further tuning.
- Document the new dock styling props and expand the README survey examples with the single-choice variant used in Storybook.

## [0.1.6] - 2025-10-16
- Keep `FlexJarDock` open by default and remember dismissals in `sessionStorage`, so users only see the panel once per session unless you opt out with `initialOpen={false}`.
- Allow the main survey question to be defined as either free text or a single-choice list while still mapping the answer to the canonical `feedback` transport key.
- Refresh Storybook with a reset helper for the dock dismissal flag and add new examples covering the single-choice main question.
- Rework the README to spotlight the dock as the primary integration and tuck the alternative entry points into a collapsible section alongside restored installation guidance.

## [0.1.5] - 2025-10-14
- Include question prompts in the transport payload using `question__<id>` keys so Flexjar logs can pair answers with their human-readable questions.
- Normalise rating and main question answers to the canonical Flexjar keys (`svar`/`feedback`) while preserving question metadata for analytics.

## [0.1.4] - 2025-10-13
- Expose `@navikt/flexjar-widget/styles.css` so consumers can import the compiled widget stylesheet without poking at internal build paths.

## [0.1.3] - 2025-10-13
- Refine rating layout spacing so emoji buttons stay on two rows on mobile while remaining left aligned on larger screens.

## [0.1.2] - 2025-10-13
- Fix rating question styling when CSS modules are not processed by the consuming build.
- Add a `width` prop to `FlexJarModal`, now defaulting to the Aksel `"large"` preset while still allowing custom modal widths.
- Introduce `FlexJarGuidePanel` for a plug-and-play `GuidePanel` + CTA that opens the modal automatically.
- Document the recommended `survey.ts` + `Flexjar.tsx` setup and refresh Storybook with a guide-panel example.

## [0.1.1] - 2025-10-13
- Prepare the widget package for the first GitHub Packages publish with consolidated exports and release documentation.

