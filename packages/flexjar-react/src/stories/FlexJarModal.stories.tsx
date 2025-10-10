import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, VStack } from "@navikt/ds-react";
import type { FlexJarQuestion } from "@navikt/flexjar-core";
import {
  FlexJarModal,
  type FlexJarModalProps,
} from "../components/FlexJarModal/index.js";

const QUESTIONS: FlexJarQuestion[] = [
  {
    id: "rating",
    type: "rating",
    prompt: "Hvor fornøyd er du med Flexjar-widgeten?",
    description: "Velg ansiktet som passer best til opplevelsen din.",
    required: true,
  },
  {
    id: "text",
    type: "text",
    prompt: "Hvordan kan vi forbedre Flexjar for teamet ditt?",
    description: "Del så mange detaljer du vil.",
    placeholder: "For eksempel: støtte for egne tema",
  },
  {
    id: "usage",
    type: "singleChoice",
    prompt: "Hvor planlegger du å ta i bruk Flexjar?",
    options: [
      { value: "intern", label: "Interne NAV-flater" },
      { value: "public", label: "Offentlige NAV-tjenester" },
      { value: "other", label: "Andre kontekster" },
    ],
  },
  {
    id: "channels",
    type: "multiChoice",
    prompt: "Hvilke kanaler bør vi prioritere?",
    options: [
      { value: "web", label: "Web", description: "Nettleser for pc og mobil" },
      { value: "native", label: "Native-apper" },
      { value: "chatbot", label: "Chatbot" },
    ],
  },
];

const TRANSPORT: FlexJarModalProps["transport"] = {
  async submit(submission) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.info("Simulert innsending", submission);
  },
};

const meta: Meta<typeof FlexJarModal> = {
  title: "Components/FlexJarModal",
  component: FlexJarModal,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    feedbackId: "storybook-feedback",
    questions: QUESTIONS,
    transport: TRANSPORT,
    submitLabel: "Send",
    cancelLabel: "Lukk",
    intro: "Vi bruker svarene dine til å forbedre Flexjar.",
    showPersonalDataNotice: true,
  },
  argTypes: {
    personalDataNotice: {
      control: false,
      description:
        "Tilpasset innhold som vises i advarselsmeldingen nederst i skjemaet.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof FlexJarModal>;

export const Default: Story = {
  render: (args: FlexJarModalProps) => {
    const [open, setOpen] = useState(true);

    return (
      <VStack gap="4" style={{ padding: "var(--a-spacing-6)" }}>
        <Button onClick={() => setOpen(true)}>Åpne tilbakemeldingsmodal</Button>
        <FlexJarModal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          events={{
            onSubmitSuccess: () => console.info("Tilbakemelding sendt"),
          }}
        />
      </VStack>
    );
  },
};

export const WithoutPersonalDataNotice: Story = {
  render: Default.render,
  args: {
    showPersonalDataNotice: false,
  },
};

export const CustomPersonalDataNotice: Story = {
  render: Default.render,
  args: {
    personalDataNotice: (
      <span>
        Ikke del sensitive opplysninger. Les mer i <a href="#">personvernerklæringen</a>.
      </span>
    ),
  },
};
