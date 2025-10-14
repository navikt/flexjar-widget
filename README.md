# Flexjar Widget

This workspace hosts `@navikt/flexjar-widget` – the React-based Flexjar survey
widget. The package bundles the modal UI, hooks, and shared types you need to
collect feedback with a configurable question set.

## Getting started

1. Configure npm to read from GitHub Packages if you have not already:

	```sh
	npm config set @navikt:registry https://npm.pkg.github.com
	```

	Provide an auth token with `read:packages` scope via `npm login --registry=https://npm.pkg.github.com` or by exporting `NODE_AUTH_TOKEN` in CI.

2. Install the widget along with its peer dependencies:

	```sh
	npm install @navikt/flexjar-widget react react-dom @navikt/ds-react
	```

	Include the Aksel design system styles and the widget stylesheet once in your app entry point:

	```ts
	import "@navikt/ds-css";
	import "@navikt/flexjar-widget/styles.css";
	```

	> Using a global CSS file instead of JavaScript imports? Add `@import "@navikt/flexjar-widget/styles.css";` below the Aksel import.

3. Follow the usage guide below to describe your survey, wire a transport handler, and render the modal.

## Usage

### Quick start with FlexJarGuidePanel

If you want a copy/paste flow that wires the trigger and modal for you, start by
splitting the survey schema from the UI.

Create `components/flexjar/survey.ts` (adjust the path to fit your project):

```ts
import {
	type FlexJarFollowUpQuestion,
	type FlexJarMainQuestion,
	type FlexJarSurveyConfig,
	type RatingQuestion,
} from "@navikt/flexjar-widget";

const ratingQuestion: RatingQuestion = {
	id: "experience",
	type: "rating",
	prompt: "Hvordan var opplevelsen?",
};

const mainQuestion: FlexJarMainQuestion = {
	id: "feedback",
	type: "text",
	prompt: "Hva tenker du om denne tjenesten?",
	minRows: 3,
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
	{
		id: "pain-points",
		type: "multiChoice",
		prompt: "Hva bør vi forbedre først?",
		description: "Velg alle som gjelder.",
		options: [
			{ value: "copy", label: "Tekst og innhold" },
			{ value: "design", label: "Design og tilgjengelighet" },
			{ value: "integrations", label: "Integrasjoner" },
			{ value: "analytics", label: "Analyse og målinger" },
		],
	},
	{
		id: "details",
		type: "text",
		prompt: "Fortell oss mer om behovene dine.",
		description: "Den informasjonen hjelper oss å prioritere riktig.",
		minRows: 2,
	},
];

export const survey: FlexJarSurveyConfig = {
	rating: ratingQuestion,
	mainQuestion,
	followUpQuestions,
};
```

Then create `components/flexjar/Flexjar.tsx`:

```tsx
"use client";

import { FlexJarGuidePanel, type FlexJarTransport } from "@navikt/flexjar-widget";
import { survey } from "@/components/flexjar/survey";

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

export const Flexjar = () => (
	<FlexJarGuidePanel
		feedbackId="oppfolgingsplan"
		survey={survey}
		transport={transport}
		panelBody="Hei! Vi jobber med en ny og forbedret oppfølgingsplan i 2025. Har du to minutter til å dele behovene dine?"
		title="Gi tilbakemelding"
		intro="Svarene dine brukes til videre forbedringsarbeid."
	/>
);
```

`FlexJarGuidePanel` internally renders an Aksel `GuidePanel` with a call-to-action
button and handles the modal lifecycle. You still get access to every
`FlexJarModal` prop (like `events`, `width`, or `personalDataNotice`) plus a few
extras:

- `panelBody`: text or JSX placed next to the open button.
- `buttonLabel`: override the button text (defaults to "Åpne spørreskjema").
- `buttonProps`: pass any `@navikt/ds-react` button props (variant, size, icon,…).
- `panelProps`: forward props to the underlying `GuidePanel`.

### Manual modal integration

#### Step 1. Describe your survey

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

// Alternatively, import the modal API via the dedicated subpath:
// import { FlexJarModal } from "@navikt/flexjar-widget/modal";

const ratingQuestion: RatingQuestion = {
	id: "experience",
	type: "rating",
	prompt: "Hvordan var opplevelsen?",
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
	{
		id: "pain-points",
		type: "multiChoice",
		prompt: "Hva bør vi forbedre først?",
		description: "Velg alle som gjelder.",
		options: [
			{ value: "copy", label: "Tekst og innhold" },
			{ value: "design", label: "Design og tilgjengelighet" },
			{ value: "integrations", label: "Integrasjoner" },
			{ value: "analytics", label: "Analyse og målinger" },
		],
	},
	{
		id: "details",
		type: "text",
		prompt: "Fortell oss mer om behovene dine.",
		description: "Den informasjonen hjelper oss å prioritere riktig.",
		minRows: 2,
	},
];

const survey: FlexJarSurveyConfig = {
	rating: ratingQuestion,
	mainQuestion,
	followUpQuestions,
};

// The widget marks the rating and main question as required automatically,
// so there is no need to set `required: true` in the survey config.

```

#### Step 2. Inject the transport handler

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

#### Step 3. Render the modal

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

- **Guide panel CTA**: reach for `FlexJarGuidePanel` when you want a ready-made `GuidePanel` + button that opens the modal without wiring local state.
- **Conditional follow-ups** are gated behind the rating automatically—no rating, no extra questions.
- **Copy & layout**: override props such as `intro`, `submitLabel`, `cancelLabel`, or provide `personalDataNotice` to replace the standard warning.
- **Layout width**: the modal defaults to the Aksel `"large"` preset (~48rem); pass `width="small"`, `width="medium"`, or a custom value (e.g. `"min(90vw, 880px)"`) for alternative sizing.
- **Events**: pass an `events` object (see `FlexJarEvents`) to react to lifecycle hooks like `onViewModal`, `onSubmitSuccess`, or validation failures.
- **Success handling**: enable `autoCloseOnSuccess` and tune `successCloseDelayMs` if you want the modal to close automatically after feedback is sent.

Flexjar’s backend expects three core fields: `feedbackId`, `svar` (the rating), and `feedback` (the main text answer). The modal enforces those requirements by always rendering the rating question first and requiring a `mainQuestion` in the survey configuration; any extra questions are delivered alongside those core values.

Every call to your `transport.submit` handler receives a `submission` object with a ready-to-send `transportPayload`. The widget enriches the payload with the human-readable question text so downstream logs keep answers and prompts together:

```ts
submission.transportPayload satisfies {
	feedbackId: string;
	svar?: number;
	feedback?: string;
	[questionIdWithPrefix: `question__${string}`]: string;
	[key: string]: string | number | string[];
};
```

The extra keys follow the pattern `question__<questionId>` and contain the exact prompt that was rendered.

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
| `width` | `"small" \| "medium" \| "large" \| number \| string` | No | `"large"` | Controls the modal width; forwarded to Aksel’s `Modal` component. |
| `renderQuestion` | `(props: FlexJarRenderQuestionProps) => React.ReactNode` | No | – | Custom renderer if you want to override the default question components. |
| `resetOnClose` | `boolean` | No | `true` | Reset answers when the modal closes. |
| `autoCloseOnSuccess` | `boolean` | No | `false` | Close the modal automatically after a successful submission. |
| `successCloseDelayMs` | `number` | No | `1600` | Delay (ms) before auto-closing when `autoCloseOnSuccess` is enabled. |
| `showPersonalDataNotice` | `boolean` | No | `true` | Toggle the default personal-data warning beneath the form. |
| `personalDataNotice` | `React.ReactNode` | No | Default warning element | Custom content for the personal-data warning. |

### FlexJarGuidePanel props

`FlexJarGuidePanel` exposes every `FlexJarModal` prop (except `open` and `onClose`, which it manages internally) and adds a few extras for the outer `GuidePanel`:

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `panelBody` | `React.ReactNode` | Yes | – | Content displayed next to the open button inside the `GuidePanel`. |
| `buttonLabel` | `string` | No | `"Åpne spørreskjema"` | Text for the call-to-action button. |
| `buttonProps` | `Omit<ButtonProps, "onClick">` | No | – | Additional `@navikt/ds-react` button props (variant, size, icon, …). |
| `panelProps` | `Omit<GuidePanelProps, "children">` | No | – | Forwarded props for the underlying `GuidePanel`. |

### FlexJarSurveyConfig

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `rating` | `RatingQuestion` | Yes | Primary entry question; modal is gated on an answer here. |
| `mainQuestion` | `FlexJarMainQuestion` | Yes | Captures the main feedback text that Flexjar expects in the `feedback` field. |
| `followUpQuestions` | `FlexJarFollowUpQuestion[]` | No | Additional questions rendered after the rating has been answered. |

<details>
<summary>Developer documentation</summary>

#### Work on the widget locally

```sh
npm install
npm run build
```

#### Publish to GitHub Packages

1. **Prepare the workspace**
	- Ensure you are on the branch you want to release from (typically `main`).
	- Step into the package folder: `cd packages/widget` before running any version or publish commands.
2. **Authenticate (one-time setup per machine)**
	- Create a personal access token with `write:packages`, `read:packages`, and `repo` scopes.
	- Store it locally: `npm config set //npm.pkg.github.com/:_authToken=<TOKEN>` *(or export `NODE_AUTH_TOKEN=<TOKEN>` in CI pipelines).* 
3. **Choose the version number**
	- We follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
		- Bug fix only → `npm version patch`
		- Backwards-compatible feature → `npm version minor`
		- Breaking change → `npm version major`
	- `npm version` updates `package.json`, generates a git tag, and commits the bump for you.
4. **Document the release**
	- Update `CHANGELOG.md` with a short summary of the changes going out.
	- Stage the changelog and version bump: `git add package.json package-lock.json CHANGELOG.md`.
5. **Verify before publishing**
	- From the repo root: `npm run lint`, `npm run test`, `npm run build`.
6. **Publish**
	- Still inside `packages/widget`: `npm publish --registry=https://npm.pkg.github.com`.
	- Push the release commit and tag to GitHub: `git push && git push --tags`.

The package exposes the modal both via the default entry (`@navikt/flexjar-widget`) and the subpath (`@navikt/flexjar-widget/modal`).

</details>
