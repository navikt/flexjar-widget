import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { FlexJarDock } from "../components/FlexJarDock";
import {
  DEFAULT_SURVEY_RATING,
  DEFAULT_SURVEY_SERVICE_FEEDBACK,
  DEFAULT_SURVEY_THUMBS,
  DEFAULT_SURVEY_STARS,
  DEFAULT_SURVEY_NPS,
} from "../presets/index.js";
import { ExamplePage, SUCCESS_TRANSPORT } from "./FlexJarDockExamplePage";

const meta: Meta<typeof FlexJarDock> = {
  title: "Components/FlexJarDock/Rating",
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

export const Rating: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    surveyId: "sykepengesoknad-kvittering",
    survey: DEFAULT_SURVEY_SERVICE_FEEDBACK,
    context: {
      tags: {
        harAktivSykmelding: "Ja",
        ukeSykefravær: "3",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Tjenesteorientert rating-undersøkelse med `DEFAULT_SURVEY_SERVICE_FEEDBACK` preset og `context.tags` for segmentering. Tags matcher analytics mock data-format for sykefraværsoppfølging.",
      },
    },
  },
};

export const Stars: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    surveyId: "dittnav-modul-rating",
    survey: DEFAULT_SURVEY_STARS,
  },
  parameters: {
    docs: {
      description: {
        story:
          "**⭐⭐⭐⭐⭐ Stars (5-point)**\\n\\nKlassisk stjerne-rating. Samme spørsmålsstruktur som Rating, men med stjerner i stedet for smileys.",
      },
    },
  },
};

export const Thumbs: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    surveyId: "am-veiviser-nytteverdi",
    survey: DEFAULT_SURVEY_THUMBS,
  },
  parameters: {
    docs: {
      description: {
        story:
          "**👎 👍 Thumbs (2-point)**\\n\\nEnkelt binært spørsmål for \"Var dette til hjelp?\". Bruker `variant: 'thumbs'`.",
      },
    },
  },
};

export const Nps: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    surveyId: "nav-no-hovedside-nps",
    survey: DEFAULT_SURVEY_NPS,
  },
  parameters: {
    docs: {
      description: {
        story:
          "**0-10 NPS (Net Promoter Score)**\\n\\nStandard NPS-undersøkelse med fargekodede soner (detractors/passives/promoters). Bruker `variant: 'nps'`.",
      },
    },
  },
};

/**
 * Progressive Disclosure demo:
 * - Text field is hidden until rating is selected (using visibleIf)
 * - Submit button is hidden until first required question is answered
 */
export const ProgressiveDisclosure: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    surveyId: "kontakt-oss-forbedring",
    survey: {
      type: "rating",
      questions: [
        {
          id: "rating",
          type: "rating",
          variant: "stars",
          prompt: "Hvordan var opplevelsen din?",
          description: "Klikk på en stjerne for å se tekstfeltet",
          required: true,
        },
        {
          id: "feedback",
          type: "text",
          prompt: "Fortell oss mer (vises etter at du har valgt rating)",
          description: "Dette feltet dukket opp via visibleIf!",
          required: false,
          maxLength: 500,
          // 👇 This question only appears AFTER rating is answered
          visibleIf: {
            field: "ANSWER",
            questionId: "rating",
            operator: "EXISTS",
          },
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "**Progressive Disclosure**\\n\\nDemonstrerer `visibleIf` for å vise spørsmål betinget. Tekstfeltet og send-knappen vises først etter at rating er valgt.",
      },
    },
  },
};
