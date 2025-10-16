import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import {
  FlexJarGuidePanel,
  type FlexJarGuidePanelProps,
} from "../components/FlexJarGuidePanel/index.js";
import {
  type FlexJarSurveyConfig,
  type FlexJarMainQuestion,
  type FlexJarFollowUpQuestion,
} from "../components/FlexJarModal/index.js";
import type { RatingQuestion } from "../core/types.js";

const RATING_QUESTION: RatingQuestion = {
  id: "experience",
  type: "rating",
  prompt: "Hvordan var det å bruke oppfølgingsplanen?",
  description:
    "Svarene du sender inn er anonyme, og blir brukt til videreutvikling av oppfølgingsplanen.",
};

const MAIN_QUESTION: FlexJarMainQuestion = {
  id: "feedback",
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
  id: "experience-choice",
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

const CHOICE_SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: CHOICE_MAIN_QUESTION,
  followUpQuestions: [OPTIONAL_TEXT_FOLLOW_UP],
};

const TRANSPORT: FlexJarGuidePanelProps["transport"] = {
  async submit(submission) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.info("Simulert innsending", submission);
  },
};

const meta: Meta<typeof FlexJarGuidePanel> = {
  title: "Components/FlexJarGuidePanel",
  component: FlexJarGuidePanel,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    feedbackId: "storybook-guidepanel",
    survey: SURVEY,
    transport: TRANSPORT,
    panelBody:
      "Hei! Vi jobber med en ny versjon av tjenesten og vil gjerne høre hva du trenger.",
    title: "Gi tilbakemelding",
    intro: "Svarene dine hjelper oss å prioritere riktig.",
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

type Story = StoryObj<typeof FlexJarGuidePanel>;

const Container = (props: FlexJarGuidePanelProps) => (
  <div style={{ padding: "var(--a-spacing-6)", maxWidth: "900px" }}>
    <FlexJarGuidePanel {...props} />
  </div>
);

export const Default: Story = {
  render: (args) => <Container {...args} />,
};

export const WithCustomButton: Story = {
  render: Default.render,
  args: {
    buttonLabel: "Del dine tanker",
    buttonProps: {
      variant: "secondary",
    },
  },
};

export const ChoiceAsMainQuestion: Story = {
  render: Default.render,
  args: {
    survey: CHOICE_SURVEY,
  },
};
