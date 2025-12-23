# Flexjar Widget

A React widget for collecting user feedback with configurable surveys. Uses [Aksel Design System](https://aksel.nav.no/).

## Quick Start

```tsx
import "@navikt/ds-css/darkside";
import "@navikt/flexjar-widget/styles.css";
import { FlexJarDock, createRatingSurvey } from "@navikt/flexjar-widget";

// Standard rating survey - the most common use case
<FlexJarDock
  feedbackId="my-app-feedback"
  survey={createRatingSurvey({
    ratingPrompt: "Hvordan var opplevelsen?",
    textPrompt: "Hva kan vi forbedre?",
  })}
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

### 1. Configure npm for GitHub Packages

```sh
npm config set @navikt:registry https://npm.pkg.github.com
```

Authenticate via `npm login --registry=https://npm.pkg.github.com` or set `NODE_AUTH_TOKEN` in CI.

### 2. Install the package

```sh
npm install @navikt/flexjar-widget @navikt/ds-react @navikt/ds-css @navikt/nav-dekoratoren-moduler
```

### 3. Import styles

```ts
// In your app entry point
import "@navikt/ds-css/darkside";
import "@navikt/flexjar-widget/styles.css";
```

---

## Survey Configuration

### Option 1: Presets (Recommended)

Use presets for common survey patterns:

```ts
import { createRatingSurvey, createTopTasksSurvey } from "@navikt/flexjar-widget";

// Rating survey (1-5 scale + optional text)
const ratingSurvey = createRatingSurvey({
  ratingPrompt: "Hvordan var opplevelsen?",
  ratingDescription: "Svarene er anonyme.",  // Optional
  textPrompt: "Hva kan vi forbedre?",
  textRequired: false,  // Optional, defaults to false
});

// Top Tasks survey (task selection + success measurement)
const topTasksSurvey = createTopTasksSurvey({
  taskPrompt: "Hva prøvde du å gjøre i dag?",
  tasks: [
    { value: "apply", label: "Søke om sykepenger" },
    { value: "status", label: "Sjekke status på søknad" },
  ],
  successPrompt: "Klarte du det?",  // Optional
});
```

### Option 2: Custom Configuration

Build any survey with the question array:

```ts
const customSurvey = {
  questions: [
    {
      id: "area",
      type: "singleChoice",
      prompt: "Hvilken del av tjenesten brukte du?",
      options: [
        { value: "search", label: "Søk" },
        { value: "profile", label: "Profil" },
      ],
      required: true,
    },
    {
      id: "feedback",
      type: "text",
      prompt: "Fortell oss mer",
      placeholder: "Skriv her...",
    },
  ],
  gateQuestionId: "area", // Optional: hides other questions until this is answered
};
```

### Question Types

| Type | Description | Value Type |
|------|-------------|------------|
| `rating` | 1-5 emoji scale | `number` |
| `text` | Multi-line text input | `string` |
| `singleChoice` | Radio buttons | `string` |
| `multiChoice` | Checkboxes | `string[]` |

---

## Sending Feedback to Flexjar API

### API Endpoints

| Environment | URL |
|-------------|-----|
| **Dev** | `https://flexjar-analytics-api.intern.dev.nav.no/api/v2/feedback` |
| **Prod** | `https://flexjar-analytics-api.intern.nav.no/api/v2/feedback` |

### Onboarding Your App

1. **Enable Azure AD** in `nais.yaml`:
   ```yaml
   azure:
     application:
       enabled: true
   ```

2. **Add outbound access**:
   ```yaml
   accessPolicy:
     outbound:
       rules:
         - application: flexjar-analytics-api
           namespace: team-esyfo
   ```

3. **Request inbound access** – Contact team-esyfo to add your app.

4. **Get OBO token** and include as `Authorization: Bearer <token>`.

### Example Transport

```ts
import { getToken, requestAzureOboToken } from "@navikt/oasis";

const transport = {
  async submit(submission) {
    const token = getToken(request);
    const obo = await requestAzureOboToken(
      token,
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

View collected feedback at:

| Environment | URL |
|-------------|-----|
| **Dev** | https://flexjar-analytics.intern.dev.nav.no |
| **Prod** | https://flexjar-analytics.intern.nav.no |

The dashboard provides filtering, statistics, rating distributions, and export to Excel/CSV.

---

## Component Props

### FlexJarDock

The main component - a sticky panel in the corner of the page.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `feedbackId` | `string` | Required | Unique ID for this survey |
| `survey` | `FlexJarSurveyConfig` | Required | Survey configuration |
| `transport` | `FlexJarTransport` | Required | Handler to submit feedback |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Dock position |
| `context` | `Record<string, unknown>` | – | Extra metadata for submission |
| `initialOpen` | `boolean` | `true` | Whether dock starts open |
| `dismissCooldownDays` | `number` | `30` | Days before dock reappears after dismissal |

### Customization Props

| Prop | Type | Default |
|------|------|---------|
| `title` | `string` | `"Gi tilbakemelding"` |
| `submitLabel` | `string` | `"Send"` |
| `cancelLabel` | `string` | `"Lukk"` |
| `successTitle` | `string` | `"Takk for tilbakemeldingen!"` |
| `transportErrorMessage` | `string` | `"Kunne ikke sende tilbakemeldingen..."` |

### Event Callbacks

```ts
<FlexJarDock
  events={{
    onSubmitSuccess: (submission) => analytics.track("feedback_sent"),
    onSubmitError: (error) => console.error(error),
    onViewDock: (feedbackId) => analytics.track("feedback_viewed"),
  }}
/>
```

---

## Persistence Behavior

The widget uses localStorage to remember dismissals. This requires:
- User consent for "surveys" storage
- `flexjar-*` pattern in decorator's allowed storage list

Without consent, the widget still works but state resets on page reload.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and release instructions.

