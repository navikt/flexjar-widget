# Flexjar Widget

This workspace hosts `@navikt/flexjar-widget` – the React-based Flexjar survey
widget. The package bundles the modal UI, hooks, and shared types you need to
collect feedback with a configurable question set.

## Getting started

```sh
npm install
npm run build
```

## Usage

### 1. Describe your survey

Every Flexjar flow starts with a mandatory rating question. Group it with any follow-ups in a `survey` object so the widget can enforce gating rules.

```tsx
import {
	FlexJarModal,
	createRatingLabels,
	type FlexJarFollowUpQuestion,
	type FlexJarMainQuestion,
	type FlexJarSurveyConfig,
	type FlexJarTransport,
	type RatingQuestion,
} from "@navikt/flexjar-widget";

const ratingQuestion: RatingQuestion = {
	id: "experience",
	type: "rating",
	prompt: "Hvordan var opplevelsen?",
	required: true,
	labels: createRatingLabels([
		"Svært dårlig",
		"Ganske dårlig",
		"Helt greit",
		"Ganske bra",
		"Svært bra",
	]),
};

// Omit `labels` to use the built-in emoji captions ("Veldig dårlig" →
// "Veldig bra"). Supply your own array via `createRatingLabels` to
// customise the text for each step while keeping the same icons.

const mainQuestion: FlexJarMainQuestion = {
	id: "feedback",
	type: "text",
	prompt: "Hva tenker du om denne tjenesten?",
	minRows: 3,
	required: true,
};

const followUpQuestions: FlexJarFollowUpQuestion[] = [
	{
		id: "channel",
		type: "singleChoice",
		prompt: "Hvor planlegger du å bruke Flexjar?",
		options: [
			{ value: "internal", label: "Interne flater" },
			{ value: "public", label: "nav.no" },
		],
	},
];
const survey: FlexJarSurveyConfig = {
	rating: ratingQuestion,
	mainQuestion,
	followUpQuestions,
};

```

### 2. Inject the transport handler

Flexjar never performs HTTP calls for you. Provide a `transport` object that knows how to persist the submission in your context.

```tsx
const transport: FlexJarTransport = {
	async submit(submission) {
		const response = await fetch("/api/flexjar", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(submission.transportPayload),
		});

		if (!response.ok) {
			throw new Error("Failed to send feedback");
		}
	},
};
```

### 3. Render the modal

```tsx
import { Button } from "@navikt/ds-react";

const Example = () => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setOpen(true)}>Åpne skjema</Button>
			<FlexJarModal
				open={open}
				onClose={() => setOpen(false)}
				feedbackId="oppfolgingsplan"
				survey={survey}
				transport={transport}
				title="Gi tilbakemelding"
				intro="Svarene dine brukes til videre forbedringsarbeid."
			/>
		</>
	);
};
```

### Customise the experience

- **Conditional follow-ups** are gated behind the rating automatically—no rating, no extra questions.
- **Copy & layout**: override props such as `intro`, `submitLabel`, `cancelLabel`, or provide `personalDataNotice` to replace the standard warning.
- **Events**: pass an `events` object (see `FlexJarEvents`) to react to lifecycle hooks like `onViewModal`, `onSubmitSuccess`, or validation failures.
- **Success handling**: enable `autoCloseOnSuccess` and tune `successCloseDelayMs` if you want the modal to close automatically after feedback is sent.

Flexjar’s backend expects three core fields: `feedbackId`, `svar` (the rating), and `feedback` (the main text answer). The modal enforces those requirements by always rendering the rating question first and requiring a `mainQuestion` in the survey configuration; any extra questions are delivered alongside those core values.

Every call to your `transport.submit` handler receives a `submission` object with a ready-to-send `transportPayload`:

```ts
submission.transportPayload satisfies {
	feedbackId: string;
	svar?: number;
	feedback?: string;
	[key: string]: string | number | string[];
};
```

Send that payload directly to the Flexjar backend, or transform it further if you need to enrich the request.

The packages ship with React (`>=18`) and `@navikt/ds-react` as peer dependencies. Consumers stay in full control of network transport, analytics, and question configuration.

### FlexJarModal props

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `boolean` | Yes | – | Controls whether the modal is visible. |
| `onClose` | `() => void` | Yes | – | Called when the modal requests to close (overlay click, escape key, close button). |
| `feedbackId` | `string` | Yes | – | Identifier included with the submission payload and analytics callbacks. |
| `survey` | `FlexJarSurveyConfig` | Yes | – | Bundles the mandatory rating + main question along with optional follow-ups. |
| `transport` | `FlexJarTransport` | Yes | – | Implementation responsible for persisting a submission. |
| `events` | `FlexJarEvents` | No | – | Optional lifecycle callbacks for analytics and debugging. |
| `context` | `Record<string, unknown>` | No | – | Extra metadata merged into the submission payload. |
| `title` | `string` | No | `"Gi tilbakemelding"` | Heading rendered in the modal header. |
| `intro` | `React.ReactNode` | No | – | Introductory text shown above the question list. |
| `submitLabel` | `string` | No | `"Send"` | Text for the primary submit button when idle. |
| `submitPendingLabel` | `string` | No | `"Sender…"` | Text for the primary button while a submission is pending. |
| `cancelLabel` | `string` | No | `"Avbryt"` | Text for the secondary cancel button. |
| `validationErrorMessage` | `string` | No | `"Svar på obligatoriske spørsmål."` | Message displayed when required answers are missing. |
| `transportErrorMessage` | `string` | No | `"Kunne ikke sende tilbakemeldingen. Prøv igjen senere."` | Message displayed when the transport throws. |
| `successTitle` | `string` | No | `"Takk for tilbakemeldingen!"` | Title shown after a successful submission. |
| `successBody` | `React.ReactNode` | No | `"Vi bruker svarene dine for å forbedre løsningen."` | Body text in the success view. |
| `successPrimaryLabel` | `string` | No | `"Lukk"` | Label for the button in the success view. |
| `className` | `string` | No | – | Optional class applied to the underlying `Modal`. |
| `renderQuestion` | `(props: FlexJarRenderQuestionProps) => React.ReactNode` | No | – | Custom renderer if you want to override the default question components. |
| `resetOnClose` | `boolean` | No | `true` | Reset answers when the modal closes. |
| `autoCloseOnSuccess` | `boolean` | No | `false` | Close the modal automatically after a successful submission. |
| `successCloseDelayMs` | `number` | No | `1600` | Delay (ms) before auto-closing when `autoCloseOnSuccess` is enabled. |
| `showPersonalDataNotice` | `boolean` | No | `true` | Toggle the default personal-data warning beneath the form. |
| `personalDataNotice` | `React.ReactNode` | No | Default warning element | Custom content for the personal-data warning. |

### FlexJarSurveyConfig

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `rating` | `RatingQuestion` | Yes | Primary entry question; modal is gated on an answer here. |
| `mainQuestion` | `FlexJarMainQuestion` | Yes | Captures the main feedback text that Flexjar expects in the `feedback` field. |
| `followUpQuestions` | `FlexJarFollowUpQuestion[]` | No | Additional questions rendered after the rating has been answered. |
