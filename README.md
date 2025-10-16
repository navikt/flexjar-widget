# Flexjar Widget

This workspace hosts `@navikt/flexjar-widget` – the React-based Flexjar survey
widget. The package bundles the modal UI, hooks, and shared types you need to
collect feedback with a configurable question set.

## Getting started

1. Configure npm to read from GitHub Packages if you have not already:

	```sh
	npm config set @navikt:registry https://npm.pkg.github.com
	```

	Provide an auth token with `read:packages` scope via
	`npm login --registry=https://npm.pkg.github.com` or by exporting
	`NODE_AUTH_TOKEN` in CI.

2. Install the widget along with its peer dependencies:

	```sh
	npm install @navikt/flexjar-widget react react-dom @navikt/ds-react
	```

	Include the Aksel design system styles and the widget stylesheet once in your
	app entry point:

	```ts
	import "@navikt/ds-css";
	import "@navikt/flexjar-widget/styles.css";
	```

	> Using a global CSS file instead of JavaScript imports? Add
	> `@import "@navikt/flexjar-widget/styles.css";` below the Aksel import.

3. Follow the usage guide below to describe your survey, wire a transport handler,
	and render the widget entry point that fits your product.

### FlexJarDock (recommended)

Need the survey available at all times? `FlexJarDock` renders a compact, sticky
panel that lets users answer the rating question immediately and complete the
rest of the form inline—without opening a modal. The dock is the default entry
point for Flexjar.

```tsx
"use client";

import { FlexJarDock, type FlexJarTransport } from "@navikt/flexjar-widget";
import { survey } from "./survey";

const transport: FlexJarTransport = {
	async submit(submission) {
		await fetch("/api/flexjar", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(submission.transportPayload),
		});
	},
};

export const FeedbackDock = () => (
	<FlexJarDock
		feedbackId="oppfolgingsplan"
		survey={survey}
		transport={transport}
		position="bottom-right"
	/>
);
```

`FlexJarDock` exposes the same survey and copy controls as the modal component,
with a few dock-specific layout options:

- `initialOpen`: control whether the dock appears on mount (defaults to open).
- `position`: stick to `"bottom-right"` (default) or `"bottom-left"`.
- `offset`: pixel distance from the viewport edge (defaults to `24`).
- `containerClassName` / `panelClassName`: style overrides for advanced layouts.

The dock opens by default and disappears for the rest of the browser session if
the user clicks «Avbryt» or the close button. `initialOpen={false}` lets you
opt out of showing the dock on a given screen, but there is no toggle button
once it has been dismissed.

#### FlexJarDock props

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `initialOpen` | `boolean` | No | `true` | Show the dock immediately on mount. Use `false` to suppress it. |
| `triggerLabel` | `string` | No | `"Gi tilbakemelding"` | Deprecated: the dock no longer renders a trigger button. |
| `triggerAriaLabel` | `string` | No | `triggerLabel` | Deprecated: the dock no longer renders a trigger button. |
| `position` | `'bottom-right' \| 'bottom-left'` | No | `'bottom-right'` | Which corner of the viewport the dock sticks to. |
| `offset` | `number` | No | `24` | Pixel distance from the viewport edge. |
| `containerClassName` | `string` | No | – | Custom class applied to the fixed outer container. |
| `panelClassName` | `string` | No | – | Custom class applied to the inner panel element. |

<details>
<summary><strong>Other entry points</strong></summary>

#### FlexJarGuidePanel

If you want a copy/paste flow that wires the trigger and modal for you, start by
splitting the survey schema from the UI.

Create `components/flexjar/survey.ts` (adjust the path to fit your project):

```ts
import {
	type FlexJarMainQuestion,
	type FlexJarSurveyConfig,
	type FlexJarRatingQuestion,
} from "@navikt/flexjar-widget";

const ratingQuestion: FlexJarRatingQuestion = {
	type: "rating",
};

const mainQuestion: FlexJarMainQuestion = {
	type: "text",
	maxLength: 500,
};

export const survey: FlexJarSurveyConfig = {
	rating: ratingQuestion,
	mainQuestion,
};

> `FlexJarModal` normalises the rating answer to the canonical Flexjar key `svar` and the main text to `feedback`. Any `id` you provide on those questions is used for analytics (via `analyticsId`) but no longer duplicates values in the transport payload. Avoid reusing the reserved `svar` or `feedback` identifiers for follow-up questions.

Need a categorical answer instead of free text? Set `mainQuestion.type` to `"singleChoice"` and provide a set of `options`. The selected option’s `value` is still delivered as the `feedback` string in the transport payload.
```

Then create `components/flexjar/Flexjar.tsx`:

```tsx
"use client";

import { FlexJarGuidePanel, type FlexJarTransport } from "@navikt/flexjar-widget";
import { survey } from "./survey";

const transport: FlexJarTransport = {
	async submit(submission) {…},
};

export const Flexjar = () => (
	<FlexJarGuidePanel
	/>
);
```

`FlexJarGuidePanel` internally renders an Aksel `GuidePanel` with a
call-to-action button and handles the modal lifecycle. You still get access to
every `FlexJarModal` prop (like `events`, `width`, or `personalDataNotice`) plus
a few extras:

- `panelBody`: text or JSX placed next to the open button.
- `buttonLabel`: override the button text (defaults to "Åpne spørreskjema").
- `buttonProps`: pass any `@navikt/ds-react` button props (variant, size, icon,…).
- `panelProps`: forward props to the underlying `GuidePanel`.

#### Manual modal integration

##### Step 1. Describe your survey

Every Flexjar flow starts with a mandatory rating question. Group it with any follow-ups in a `survey` object so the widget can enforce gating rules.

```tsx
import {
	FlexJarModal,
	createRatingLabels,
	type FlexJarMainQuestion,
	type FlexJarSurveyConfig,
	type FlexJarTransport,
	type FlexJarRatingQuestion,
} from "@navikt/flexjar-widget";

// Alternatively, import the modal API via the dedicated subpath:
// import { FlexJarModal } from "@navikt/flexjar-widget/modal";

const ratingQuestion: FlexJarRatingQuestion = {
	id: "experience",
	type: "rating",
	prompt: "Hvordan var det å bruke oppfølgingsplanen?",
	description:
		"Svarene du sender inn er anonyme, og blir brukt til videreutvikling av oppfølgingsplanen.",
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
	prompt:
		"Opplever du at oppfølgingsplanen er et nyttig verktøy for å følge opp den ansatte?",
	minRows: 3,
	maxLength: 500,
};

const survey: FlexJarSurveyConfig = {
	rating: ratingQuestion,
	mainQuestion,
};

// The widget marks the rating and main question as required automatically,
// so there is no need to set `required: true` in the survey config.

// Rating answers are only reported under the `svar` key, and the main question
// under `feedback`, matching the Flexjar backend schema. Supplying an `id`
// remains optional and is best suited for analytics tagging via `analyticsId`.

```

##### Step 2. Inject the transport handler

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

##### Step 3. Render the modal

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

</details>

### Customise the experience

- **Sticky dock**: use `FlexJarDock` to keep the survey visible on the page and reveal follow-up questions inline after the rating.
- **Guide panel CTA**: reach for `FlexJarGuidePanel` when you want a ready-made `GuidePanel` + button that opens the modal without wiring local state.
- **Conditional follow-ups** are gated behind the rating automatically—no rating, no extra questions.
- **Copy & layout**: override props such as `intro`, `submitLabel`, `cancelLabel`, or provide `personalDataNotice` to replace the standard warning.
- **Layout width**: the modal defaults to the Aksel `"large"` preset (~48rem); pass `width="small"`, `width="medium"`, or a custom value (e.g. `"min(90vw, 880px)"`) for alternative sizing.
- **Events**: pass an `events` object (see `FlexJarEvents`) to react to lifecycle hooks like `onViewModal`, `onSubmitSuccess`, or validation failures.
- **Success handling**: enable `autoCloseOnSuccess` and tune `successCloseDelayMs` if you want the modal to close automatically after feedback is sent.

Flexjar’s backend expects three core fields: `feedbackId`, `svar` (the rating), and `feedback` (a string value for the main answer). The modal enforces those requirements by always rendering the rating question first and requiring a `mainQuestion` in the survey configuration; any extra questions are delivered alongside those core values.

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

The extra keys follow the pattern `question__<questionId>` and contain the exact prompt that was rendered. Core questions use the canonical names `question__svar` and `question__feedback` so Flexjar logs line up with the standard schema.

- Rating answers are emitted only under `svar`.
- Main text answers are emitted only under `feedback`.
- Additional questions continue to use their configured IDs for both the value and `question__` metadata.

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
| `rating` | `FlexJarRatingQuestion` | Yes | Primary entry question; modal is gated on an answer here. |
| `mainQuestion` | `FlexJarMainQuestion` | Yes | Captures the main answer (text or single choice) that Flexjar expects in the `feedback` field. |
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
