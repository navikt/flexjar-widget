import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useCallback, useState } from "react";
import { Button } from "@navikt/ds-react";
import { FlexJarDock, type FlexJarDockProps } from "../components/FlexJarDock/index.js";
import type {
  FlexJarSurveyConfig,
  FlexJarMainQuestion,
  FlexJarRatingQuestion,
  FlexJarFollowUpQuestion,
} from "../components/surveyTypes.js";

const RATING_QUESTION: FlexJarRatingQuestion = {
  type: "rating",
  prompt: "Hvordan var det å bruke oppfølgingsplanen?",
  description:
    "Svarene du sender inn er anonyme, og blir brukt til videreutvikling av oppfølgingsplanen.",
};

const MAIN_QUESTION: FlexJarMainQuestion = {
  type: "text",
  prompt: "Opplever du at oppfølgingsplanen er et nyttig verktøy for å følge opp den ansatte?",
  minRows: 3,
  maxLength: 500,
};

const SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: MAIN_QUESTION,
};

const CHOICE_MAIN_QUESTION: FlexJarMainQuestion = {
  type: "singleChoice",
  prompt: "Opplever du at oppfølgingsplanen er et nyttig verktøy for å følge opp den ansatte?",
  options: [
    { value: "yes", label: "Ja" },
    { value: "no", label: "Nei" },
    { value: "unsure", label: "Vet ikke" },
  ],
};

const OPTIONAL_TEXT_FOLLOW_UP: FlexJarFollowUpQuestion = {
  id: "oppfolgingsplan-detaljer",
  type: "text",
  prompt: "Hva bør vi vite for å forbedre oppfølgingsplanen?",
  minRows: 3,
  maxLength: 500,
};

const OPTIONAL_MAIN_SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: {
    ...MAIN_QUESTION,
    prompt:
      "Hvordan kan oppfølgingsplanen bli et bedre verktøy for deg? (Valgfritt)",
    required: false,
  },
  followUpQuestions: [OPTIONAL_TEXT_FOLLOW_UP],
};

const CHOICE_SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: CHOICE_MAIN_QUESTION,
  followUpQuestions: [OPTIONAL_TEXT_FOLLOW_UP],
};

const TRANSPORT: FlexJarDockProps["transport"] = {
  async submit(submission) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.info("Simulert innsending", submission);
  },
};

const meta: Meta<typeof FlexJarDock> = {
  title: "Components/FlexJarDock",
  component: FlexJarDock,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    feedbackId: "storybook-dock",
    survey: SURVEY,
    transport: TRANSPORT,
    title: "Gi tilbakemelding",
  },
  argTypes: {
    transport: {
      control: false,
    },
    survey: {
      control: false,
    },
  },
};

export default meta;

type Story = StoryObj<typeof FlexJarDock>;

const PageWrapper = (props: FlexJarDockProps) => {
  const [resetToken, setResetToken] = useState(0);

  const handleReset = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.sessionStorage.removeItem(`flexjar-dock-dismissed:${props.feedbackId}`);
    setResetToken((token) => token + 1);
  }, [props.feedbackId]);

  return (
    <div
      style={{
        minHeight: "120vh",
        padding: "var(--a-spacing-10)",
        background: "var(--a-surface-subtle)",
      }}
    >
      <div style={{ maxWidth: "620px", display: "grid", gap: "var(--a-spacing-2)" }}>
        <h2>Prototype-side</h2>
        <p>
          Scroll gjerne for å se at docken holder seg i hjørnet. Skjemaet er åpent som
          standard, og når du lukker det med «Avbryt» eller krysset forblir det lukket
          resten av økten.
        </p>
        <Button size="small" variant="secondary" onClick={handleReset} style={{ width: "fit-content" }}>
          Vis Flexjar igjen
        </Button>
      </div>
      <FlexJarDock key={resetToken} {...props} />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <PageWrapper {...args} />,
};

export const ChoiceAsMainQuestion: Story = {
  render: Default.render,
  args: {
    survey: CHOICE_SURVEY,
  },
};

export const OptionalMainQuestion: Story = {
  render: Default.render,
  args: {
    survey: OPTIONAL_MAIN_SURVEY,
  },
};
