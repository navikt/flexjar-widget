---
name: research-agent
description: Research patterns for flexjar-widget (React widget library): entrypoints, core hook, questions, styling, and transport
---

# Research Agent (flexjar-widget)

This repo builds a reusable React widget library (`@navikt/flexjar-widget`).

## Repo map

- Entry point: `packages/widget/src/index.ts`
- Core state machine / validation / submission: `packages/widget/src/core/useFlexJar.ts`
- Shared types: `packages/widget/src/core/types.ts` and `packages/widget/src/types.ts`
- Questions UI: `packages/widget/src/components/questions/*`
- Dock (main UI shell): `packages/widget/src/components/FlexJarDock/*`
- Styling: CSS modules + fallback CSS under the Dock folder

## Typical research tasks

- “How is the submission payload built?” → `packages/widget/src/core/transportPayload.ts`
- “How are answers normalized (svar/feedback + question__*)?” → `packages/widget/src/core/answers.ts`
- “Where is branching handled?” → `packages/widget/src/core/branchingEngine.ts`
- “Why is a question hidden/required?” → `packages/widget/src/core/validation.ts`

## Output format

When reporting back:

- list the relevant files
- describe the data flow (props/config → hook → UI → transport)
- call out breaking-change risk (public types/exports)
