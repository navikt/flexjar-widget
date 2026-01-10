import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { FlexJarDock } from "../components/FlexJarDock";
import type { FlexJarSurveyConfig } from "../components/surveyTypes.js";
import { DEFAULT_SURVEY_RATING } from "../presets/index.js";
import { ExamplePage, SUCCESS_TRANSPORT } from "./FlexJarDockExamplePage";

const CUSTOM_SURVEY: FlexJarSurveyConfig = {
  type: "custom",
  questions: [
    {
      id: "innsender-rolle",
      type: "singleChoice",
      prompt: "Hvem skriver du på vegne av?",
      required: true,
      options: [
        { value: "privat", label: "Meg selv" },
        { value: "employer", label: "Arbeidsgiver" },
        { value: "provider", label: "Behandler" },
      ],
    },
    {
      id: "opplevelse-brukervennlighet",
      type: "rating",
      prompt: "Hvor enkelt var det å finne frem?",
      required: true,
    },
    {
      id: "tilleggskommentar",
      type: "text",
      prompt: "Har du andre tilbakemeldinger?",
      required: false,
    },
  ],
};

const meta: Meta<typeof FlexJarDock> = {
  title: "Components/FlexJarDock/Custom",
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
    surveyId: "storybook-dock",
    survey: DEFAULT_SURVEY_RATING,
    transport: SUCCESS_TRANSPORT,
    behavior: { dismissCooldownDays: 0 },
  },
  argTypes: {
    transport: { control: false },
    survey: { control: false },
    events: { control: false },
    context: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof FlexJarDock>;

export const Custom: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    surveyId: "kontakt-oss-skjema-custom",
    survey: CUSTOM_SURVEY,
  },
  parameters: {
    docs: {
      description: {
        story:
          "En helt tilpasset undersøkelse definert med 'custom' type, som kombinerer flervalg, rating og fritekst fritt.",
      },
    },
  },
};
