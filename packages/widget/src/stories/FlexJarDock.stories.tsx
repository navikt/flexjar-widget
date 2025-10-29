import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useCallback, useState } from "react";
import { Button } from "@navikt/ds-react";
import { FlexJarDock, type FlexJarDockProps } from "../components/FlexJarDock";
import type {
  FlexJarFollowUpQuestion,
  FlexJarMainQuestion,
  FlexJarRatingQuestion,
  FlexJarSurveyConfig,
} from "../components/surveyTypes.js";
import { removeConsentValue } from "../components/shared/consentStorage.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const RATING_QUESTION: FlexJarRatingQuestion = {
  type: "rating",
  prompt: "Hvordan opplevde du å svare på spørsmålene?",
  description:
    "Svarene du sender inn er anonyme, og blir brukt til videreutvikling av tjenesten.",
  scale: 5,
  required: true,
};

const MAIN_TEXT_QUESTION: FlexJarMainQuestion = {
  type: "text",
  prompt: "Legg gjerne til en begrunnelse (valgfritt)",
  description: "Alle tilbakemeldinger er til stor nytte for oss",
  minRows: 4,
  maxLength: 500,
  required: false,
};

const DEFAULT_SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: MAIN_TEXT_QUESTION,
};

const OPTIONAL_FOLLOW_UPS: FlexJarFollowUpQuestion[] = [
  {
    id: "best-del",
    type: "text",
    prompt: "Hva var det beste med opplevelsen?",
    maxLength: 400,
    required: false,
  },
  {
    id: "forbedringstype",
    type: "singleChoice",
    prompt: "Hva ønsker du mest at vi jobber videre med?",
    options: [
      { value: "speed", label: "Ytelse og hastighet" },
      { value: "content", label: "Innhold og forklaringer" },
      { value: "accessibility", label: "Tilgjengelighet" },
      { value: "other", label: "Noe annet" },
    ],
    required: false,
  },
];

const SURVEY_WITH_FOLLOW_UPS: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: MAIN_TEXT_QUESTION,
  followUpQuestions: OPTIONAL_FOLLOW_UPS,
};

const OPTIONAL_MAIN_SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: {
    ...MAIN_TEXT_QUESTION,
    prompt: "Vil du dele noe mer? (Valgfritt)",
    required: false,
  },
};

const CHOICE_MAIN_QUESTION: FlexJarMainQuestion = {
  type: "singleChoice",
  prompt: "Hvordan beskriver du helhetsopplevelsen?",
  options: [
    { value: "great", label: "Veldig bra" },
    { value: "good", label: "Bra" },
    { value: "neutral", label: "Helt greit" },
    { value: "poor", label: "Ikke bra" },
  ],
  required: true,
};

const CHOICE_SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: CHOICE_MAIN_QUESTION,
  followUpQuestions: [
    {
      id: "choice-oppfolging",
      type: "text",
      prompt: "Hva skulle vært annerledes for at du skulle gitt en bedre score?",
      maxLength: 500,
      required: false,
    },
  ],
};

const QUICK_FORM_SURVEY: FlexJarSurveyConfig = {
  rating: {
    ...RATING_QUESTION,
    description: undefined,
  },
  mainQuestion: {
    type: "text",
    prompt: "Beskriv kort hva som ikke fungerte.",
    maxLength: 300,
    minRows: 2,
  },
};

const SUCCESS_TRANSPORT: FlexJarDockProps["transport"] = {
  async submit(submission) {
    await delay(800);
    console.info("Simulert innsending", submission);
  },
};

const FAILING_TRANSPORT: FlexJarDockProps["transport"] = {
  async submit() {
    await delay(600);
    throw new Error("Kunne ikke nå tjenesten");
  },
};

const meta: Meta<typeof FlexJarDock> = {
  title: "Components/FlexJarDock",
  component: FlexJarDock,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Eksempelsamling som viser hvordan FlexJarDock kan konfigureres med ulike spørresett, tekster og plasseringer.",
      },
    },
  },
  args: {
    feedbackId: "storybook-dock",
    survey: DEFAULT_SURVEY,
    transport: SUCCESS_TRANSPORT,
    dismissCooldownDays: 0,
  },
  argTypes: {
    transport: { control: false },
    survey: { control: false },
    events: { control: false },
    context: { control: false },
    position: {
      options: ["bottom-right", "bottom-left"],
      control: { type: "inline-radio" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FlexJarDock>;

const ExamplePage = (props: FlexJarDockProps) => {
  const [resetToken, setResetToken] = useState(0);

  const handleReset = useCallback(() => {
    void (async () => {
      await removeConsentValue(`flexjar-dock-dismissed:${props.feedbackId}`);
      setResetToken((token) => token + 1);
    })();
  }, [props.feedbackId]);

  return (
    <div
      style={{
        minHeight: "120vh",
        padding: "var(--a-spacing-12)",
        background: "var(--a-surface-subtle)",
        color: "var(--a-text-default)",
      }}
    >
      <div style={{ maxWidth: "640px", display: "grid", gap: "var(--a-spacing-2)" }}>
        <h2 style={{ margin: 0 }}>Designflate</h2>
        <p style={{ margin: 0 }}>
          Scroll litt for å se at docken holder seg i hjørnet. Bruk knappen under for å
          nullstille den lokale lagringen som holder docken minimert etter at du har
          lukket den.
        </p>
        <Button
          size="small"
          variant="secondary"
          onClick={handleReset}
          style={{ width: "fit-content" }}
        >
          Nullstill docken
        </Button>
      </div>
      <FlexJarDock key={resetToken} {...props} />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ExamplePage {...args} />,
};

export const InitiallyMinimized: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-minimized",
    initialOpen: false,
    minimizedButtonLabel: "Åpne tilbakemeldingsskjema",
  },
};

export const OptionalMainQuestion: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-optional",
    survey: OPTIONAL_MAIN_SURVEY,
  },
};

export const WithFollowUpQuestions: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-followups",
    survey: SURVEY_WITH_FOLLOW_UPS,
  },
};

export const ChoiceAsMainQuestion: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-choice",
    survey: CHOICE_SURVEY,
  },
};

export const BottomLeftPlacement: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-left",
    position: "bottom-left",
    offset: 32,
  },
};

export const TransportErrorState: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-error",
    survey: QUICK_FORM_SURVEY,
    transport: FAILING_TRANSPORT,
    submitLabel: "Send inn",
    transportErrorMessage: "Vi klarte ikke å sende inn akkurat nå. Prøv igjen om litt.",
    showPersonalDataNotice: false,
  },
};

export const HideAfterSubmit: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-hide",
    hideAfterSubmit: true,
    dismissCooldownDays: 30,
    successTitle: "Takk for tilbakemeldingen!",
    successBody: "Docken vil nå være helt skjult i 30 dager (eller til du nullstiller).",
  },
};
