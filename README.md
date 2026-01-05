# Flexjar Widget

En React widget for å samle brukertilbakemeldinger. Bruker [Aksel Design System](https://aksel.nav.no/).

## Quick Start

```tsx
import "@navikt/ds-css/darkside";
import "@navikt/flexjar-widget/styles.css";
import { FlexJarDock, NAV_STANDARD_RATING } from "@navikt/flexjar-widget";

<FlexJarDock
  feedbackId="my-app-feedback"
  survey={NAV_STANDARD_RATING}
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
# Configure npm for GitHub Packages
npm config set @navikt:registry https://npm.pkg.github.com

# Install
npm install @navikt/flexjar-widget @navikt/ds-react @navikt/ds-css
```

**For eksterne flater** (nav.no), installer også:
```sh
npm install @navikt/nav-dekoratoren-moduler
```

---

## Props

```tsx
<FlexJarDock
  // Required
  feedbackId="unique-id"
  survey={NAV_STANDARD_RATING}
  transport={{ submit: async (data) => { ... } }}
  
  // Optional - grouped configs
  labels={{ submit: "Send", cancel: "Avbryt" }}
  success={{ title: "Takk!", autoClose: true }}
  style={{ position: "bottom-left" }}
  behavior={{ storageStrategy: "localStorage" }}
  
  // Optional - callbacks
  events={{ onSubmitSuccess: () => { ... } }}
  context={{ page: "/soknad" }}
  metadata={{ team: "esyfo" }}
/>
```

### Grouped Props

| Prop | Options |
|------|---------|
| `labels` | `submit`, `submitPending`, `cancel`, `validationError`, `transportError`, `minimizedButton` |
| `success` | `title`, `body`, `primaryLabel`, `autoClose`, `autoCloseDelayMs` |
| `style` | `position`, `offset`, `containerClassName`, `panelClassName`, `panelBackground`, `panelBorderColor` |
| `behavior` | `initialOpen`, `resetOnClose`, `dismissCooldownDays`, `hideAfterSubmit`, `showPersonalDataNotice`, `storageStrategy` |

### Storage Strategy

Widgeten støtter ulike lagringsstrategier for dismiss-tilstand:

| Strategy | Use Case |
|----------|----------|
| `"consent"` (default) | Eksterne flater (nav.no) - krever brukersamtykke |
| `"localStorage"` | Interne flater (Modia, Gosys) - localStorage direkte |
| `"none"` | Ingen persistering |

```tsx
// Intern flate (Modia)
<FlexJarDock
  feedbackId="modia-feedback"
  survey={NAV_STANDARD_RATING}
  transport={transport}
  behavior={{ storageStrategy: "localStorage" }}
/>
```

---

## Survey Presets

### NAV_STANDARD_RATING

Ferdig konfigurert 5-stjerners rating med valgfri tekst:

```tsx
import { NAV_STANDARD_RATING } from "@navikt/flexjar-widget";

<FlexJarDock
  feedbackId="my-app"
  survey={NAV_STANDARD_RATING}
  transport={transport}
/>
```

### createRatingSurvey

```tsx
import { createRatingSurvey } from "@navikt/flexjar-widget";

const survey = createRatingSurvey({
  ratingPrompt: "Hvordan var opplevelsen?",
  ratingDescription: "1 er dårlig, 5 er bra",
  followUpQuestions: [
    { id: "feedback", type: "text", prompt: "Har du andre tilbakemeldinger?" }
  ]
});
```

### createTopTasksSurvey

```tsx
import { createTopTasksSurvey } from "@navikt/flexjar-widget";

const survey = createTopTasksSurvey({
  taskPrompt: "Hva prøvde du å gjøre?",
  tasks: [
    { value: "apply", label: "Søke om sykepenger" },
    { value: "status", label: "Sjekke status" },
  ],
});
```

### createDiscoverySurvey

```tsx
import { createDiscoverySurvey } from "@navikt/flexjar-widget";

const survey = createDiscoverySurvey({
  prompt: "Hva prøvde du å finne?",
});
```

---

## Custom Survey

```tsx
const customSurvey = {
  questions: [
    {
      id: "rating",
      type: "rating",
      prompt: "Hvor fornøyd er du?",
      required: true,
    },
    {
      id: "feedback",
      type: "text",
      prompt: "Fortell oss mer",
      required: false,
    },
  ],
  gateQuestionId: "rating", // Skjul andre spørsmål til dette er besvart
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

---

## Flexjar API

### Endpoints

| Env | URL |
|-----|-----|
| Dev | `https://flexjar-analytics-api.intern.dev.nav.no/api/v2/feedback` |
| Prod | `https://flexjar-analytics-api.intern.nav.no/api/v2/feedback` |

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
    
    await fetch("https://flexjar-analytics-api.intern.nav.no/api/v2/feedback", {
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
