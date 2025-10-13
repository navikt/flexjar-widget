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
  prompt: "Hvordan var opplevelsen?",
  description: "Start med å velge et ansikt.",
};

const MAIN_QUESTION: FlexJarMainQuestion = {
  id: "feedback",
  type: "text",
  prompt: "Hva bør vi vite for å forbedre løsningen?",
  minRows: 3,
};

const FOLLOW_UP_QUESTIONS: FlexJarFollowUpQuestion[] = [
  {
    id: "channels",
    type: "multiChoice",
    prompt: "Hvor møter brukerne Flexjar først?",
    options: [
      { value: "navno", label: "nav.no" },
      { value: "minside", label: "Ditt NAV" },
      { value: "app", label: "NAV-appen" },
    ],
  },
];

const SURVEY: FlexJarSurveyConfig = {
  rating: RATING_QUESTION,
  mainQuestion: MAIN_QUESTION,
  followUpQuestions: FOLLOW_UP_QUESTIONS,
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
