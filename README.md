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

Define your survey and transport handler:

```tsx
import { FlexJarModal } from "@navikt/flexjar-react";
import { FlexJarQuestion, FlexJarTransport } from "@navikt/flexjar-core";

const questions: FlexJarQuestion[] = [
	{
		id: "experience",
		type: "rating",
		prompt: "Hvordan var opplevelsen?",
		required: true,
		scale: 5,
		minimumLabel: "Svært dårlig",
		maximumLabel: "Svært bra",
	},
	{
		id: "improvement",
		type: "text",
		prompt: "Hva kan forbedres?",
		minRows: 3,
	},
];

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

Render the modal where you need it:

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
				questions={questions}
				transport={transport}
				title="Gi tilbakemelding"
				intro="Svarene dine er anonyme og brukes til videre bobehandlingen."
			/>
		</>
	);
};
```

The packages are published with React (`>=18`) and `@navikt/ds-react` as peer dependencies. Consumers provide network transport via the `FlexJarTransport` interface when embedding the modal.
