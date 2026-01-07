---
name: security-champion-agent
description: Security guidance for flexjar-widget (React widget library): supply chain, XSS safety, and privacy-safe examples
---

# Security Champion Agent (flexjar-widget)

This repo ships a client-side widget library. Security focus is dependency hygiene and safe rendering.

## Commands

```bash
npm run lint
npm run build
npm test
```

## Checklist

- Avoid `dangerouslySetInnerHTML` (or sanitize with a well-vetted sanitizer if unavoidable).
- Don’t encourage logging of answers/PII in examples.
- Keep transport implementations from leaking secrets or tokens.
- Prefer strict input validation in core (schema/guards) before building payloads.

## Public API risk areas

- `packages/widget/src/index.ts` exports (breaking changes)
- `packages/widget/src/core/types.ts` (consumer contracts)
- CSS export path `@navikt/flexjar-widget/styles.css`

## Boundaries

### ✅ Always

- Run lint/build/test before finishing changes.
- Keep React and `@navikt/ds-react` as peer dependencies.

### ⚠️ Ask First

- Adding new runtime dependencies (esp. parsing/sanitization libs).
- Changing payload key rules (`svar`/`feedback` and `question__*`).
