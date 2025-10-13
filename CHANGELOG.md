# Changelog

All notable changes to `@navikt/flexjar-widget` will be documented in this file.

## [Unreleased]
- Add entries here before cutting the next release.

## [0.1.3] - 2025-10-13
- Refine rating layout spacing so emoji buttons stay on two rows on mobile while remaining left aligned on larger screens.

## [0.1.2] - 2025-10-13
- Fix rating question styling when CSS modules are not processed by the consuming build.
- Add a `width` prop to `FlexJarModal`, now defaulting to the Aksel `"large"` preset while still allowing custom modal widths.
- Introduce `FlexJarGuidePanel` for a plug-and-play `GuidePanel` + CTA that opens the modal automatically.
- Document the recommended `survey.ts` + `Flexjar.tsx` setup and refresh Storybook with a guide-panel example.

## [0.1.1] - 2025-10-13
- Prepare the widget package for the first GitHub Packages publish with consolidated exports and release documentation.

