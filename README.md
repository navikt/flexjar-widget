# Flexjar Widget

En React widget for å samle brukertilbakemeldinger. Bruker [Aksel Design System](https://aksel.nav.no/).

## Quick Start

```tsx
import "@navikt/ds-css/darkside";
import "@navikt/flexjar-widget/styles.css";
import { FlexJarDock, DEFAULT_SURVEY_RATING } from "@navikt/flexjar-widget";

<FlexJarDock
  surveyId="my-app-feedback"
  survey={DEFAULT_SURVEY_RATING}
  transport={{
    submit: async (submission) => {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission.transportPayload),
      });
    },
  }}
/>
```

---

## Installation

```sh
npm config set @navikt:registry https://npm.pkg.github.com
npm install @navikt/flexjar-widget @navikt/ds-react @navikt/ds-css
```

For eksterne flater: `npm install @navikt/nav-dekoratoren-moduler`

---

## Survey Presets

### Default Presets (Ready to use)

```tsx
import { DEFAULT_SURVEY_RATING, DEFAULT_SURVEY_DISCOVERY } from "@navikt/flexjar-widget";

// Rating: 5-stjerner + tekst
<FlexJarDock survey={DEFAULT_SURVEY_RATING} ... />

// Discovery: Fri tekst + suksess-spørsmål  
<FlexJarDock survey={DEFAULT_SURVEY_DISCOVERY} ... />
```

### Builder Functions (For domain-specific surveys)

```tsx
import { createTopTasksSurvey, createTaskPrioritySurvey } from "@navikt/flexjar-widget";

// Top Tasks - krever oppgaveliste
const topTasks = createTopTasksSurvey({
  tasks: [
    { value: "apply", label: "Søke om sykepenger" },
    { value: "status", label: "Sjekke status" },
  ]
});

// Task Priority - krever oppgaveliste
const taskPriority = createTaskPrioritySurvey({
  tasks: [
    { value: "apply", label: "Søke om sykepenger" },
    // ... 20-50 oppgaver
  ]
});
```

---

## Props

```tsx
<FlexJarDock
  surveyId="unique-id"
  survey={DEFAULT_SURVEY_RATING}
  transport={{ submit: async (data) => { ... } }}
  
  labels={{ submit: "Send", cancel: "Avbryt" }}
  success={{ title: "Takk!", autoClose: true }}
  style={{ position: "bottom-left" }}
  behavior={{ storageStrategy: "localStorage", questionLayout: "auto" }}
  
  events={{ onSubmitSuccess: () => { ... } }}
  context={{
    tags: { rolle: "arbeidsgiver", harSykmelding: true },
    debug: { correlationId: "abc-123" },
  }}
/>
```

### Storage Strategy

| Strategy | Use Case |
|----------|----------|
| `"consent"` (default) | Eksterne flater (nav.no) |
| `"localStorage"` | Interne flater (Modia, Gosys) |
| `"none"` | Ingen persistering |

### Question Layout (1 side vs flere sider)

- `questionLayout: "auto"` (default): Step-mode kun når survey har branching (logic).
- `questionLayout: "singlePage"`: All visible spørsmål på én side (ingen Neste/Tilbake).
- `questionLayout: "steps"`: Ett spørsmål av gangen med Neste/Tilbake (også uten branching).

---

## Custom Survey

```tsx
const customSurvey = {
  questions: [
    { id: "rating", type: "rating", prompt: "Hvor fornøyd er du?", required: true },
    { id: "feedback", type: "text", prompt: "Fortell oss mer", required: false },
  ],
  gateQuestionId: "rating",
};
```

### Question Types

| Type | Value Type |
|------|------------|
| `rating` | `number` (1-5) |
| `text` | `string` |
| `singleChoice` | `string` |
| `multiChoice` | `string[]` |

---

## Branching Logic

```tsx
const branchingSurvey = {
  questions: [
    {
      id: "success",
      type: "singleChoice",
       prompt: "Fikk du gjort det du kom for?",
      options: [
        { value: "YES", label: "Ja" },
        { value: "NO", label: "Nei" },
      ],
      logic: [
        {
          condition: { field: "ANSWER", operator: "EQ", value: "YES" },
          action: { type: "JUMP_TO", targetId: "rating" },
        },
      ],
    },
    { id: "blocker", type: "text", prompt: "Hva stoppet deg?" },
    { id: "rating", type: "rating", prompt: "Hvor fornøyd er du?" },
  ],
};
```
```

---

## Flexjar API

### Endpoints

| Env | URL |
|-----|-----|
| Dev | `https://flexjar-analytics-api.intern.dev.nav.no/api/v1/feedback` |
| Prod | `https://flexjar-analytics-api.intern.nav.no/api/v1/feedback` |

### Onboarding

1. Enable Azure AD i `nais.yaml`:
   ```yaml
   azure:
     application:
       enabled: true
   ```

2. Add outbound access:
   ```yaml
   accessPolicy:
     outbound:
       rules:
         - application: flexjar-analytics-api
           namespace: team-esyfo
   ```

3. Kontakt team-esyfo for inbound access.

### Transport Example

```tsx
import { getToken, requestAzureOboToken } from "@navikt/oasis";

const transport = {
  async submit(submission) {
    const obo = await requestAzureOboToken(
      getToken(request),
      "api://prod-gcp.team-esyfo.flexjar-analytics-api/.default"
    );
    
    await fetch("https://flexjar-analytics-api.intern.nav.no/api/v1/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obo.token}`,
      },
      body: JSON.stringify(submission.transportPayload),
    });
  },
};
```

---

## Analytics Dashboard

| Env | URL |
|-----|-----|
| Dev | https://flexjar-analytics.intern.dev.nav.no |
| Prod | https://flexjar-analytics.intern.nav.no |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
