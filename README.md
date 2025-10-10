# Flexjar Widget

This workspace hosts the upcoming Flexjar widget packages:

- `@navikt/flexjar-core` – transport-agnostic hooks, validation, and shared types
- `@navikt/flexjar-react` – Aksel-based components that render configurable Flexjar surveys

## Getting started

```sh
npm install
npm run build
```

## Usage

### 1. Describe your survey

Every Flexjar flow starts with a mandatory rating question. Pass it as the dedicated `ratingQuestion` prop and list any follow-up questions separately in `followUpQuestions`.

```tsx
import { FlexJarModal } from "@navikt/flexjar-react";
import type {
	FlexJarTransport,
	RatingQuestion,
	FlexJarQuestion,
} from "@navikt/flexjar-core";

const ratingQuestion: RatingQuestion = {
	id: "experience",
	type: "rating",
	prompt: "Hvordan var opplevelsen?",
	required: true,
	scale: 5,
	minimumLabel: "Svært dårlig",
	maximumLabel: "Svært bra",
};

const followUpQuestions: Array<Exclude<FlexJarQuestion, { type: "rating" }>> = [
	{
		id: "improvement",
		type: "text",
		prompt: "Hva kan forbedres?",
		minRows: 3,
	},
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
```

### 2. Inject the transport handler

Flexjar never performs HTTP calls for you. Provide a `transport` object that knows how to persist the submission in your context.

```tsx
const transport: FlexJarTransport = {
	async submit(payload) {
		const response = await fetch("/api/flexjar", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
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
				ratingQuestion={ratingQuestion}
				followUpQuestions={followUpQuestions}
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

The packages ship with React (`>=18`) and `@navikt/ds-react` as peer dependencies. Consumers stay in full control of network transport, analytics, and question configuration.
