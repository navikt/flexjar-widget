import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@navikt/ds-react";
import { FlexJarDock, type FlexJarDockProps } from "../components/FlexJarDock";
import type {
  FlexJarFollowUpQuestion,
  FlexJarMainQuestion,
  FlexJarRatingQuestion,
  FlexJarSurveyConfig,
} from "../components/surveyTypes.js";
import { removeConsentValue } from "../components/shared/consentStorage.js";

// Type for the Storybook mock consent API
interface FlexJarMockConsentAPI {
  setConsent: (granted: boolean) => void;
  getConsent: () => boolean;
}

declare global {
  interface Window {
    __FLEXJAR_MOCK_CONSENT__?: FlexJarMockConsentAPI;
  }
}

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
  const [hasConsent, setHasConsent] = useState(() => {
    const stored = localStorage.getItem("__flexjar_storybook_consent__");
    return stored === null ? true : stored === "true";
  });

  const handleReset = useCallback(() => {
    void (async () => {
      await removeConsentValue(`flexjar-dock-dismissed:${props.feedbackId}`);
      setResetToken((token) => token + 1);
    })();
  }, [props.feedbackId]);

  const handleGrantConsent = useCallback(() => {
    const mockAPI = window.__FLEXJAR_MOCK_CONSENT__;
    if (mockAPI) {
      mockAPI.setConsent(true);
      setHasConsent(true);
    }
  }, []);

  const handleRevokeConsent = useCallback(() => {
    const mockAPI = window.__FLEXJAR_MOCK_CONSENT__;
    if (mockAPI) {
      mockAPI.setConsent(false);
      setHasConsent(false);
    }
  }, []);

  useEffect(() => {
    // Listen for consent changes from controls
    const handleConsentChange = () => {
      const stored = localStorage.getItem("__flexjar_storybook_consent__");
      setHasConsent(stored === null ? true : stored === "true");
    };

    window.addEventListener("__flexjar_consent_change__", handleConsentChange);
    return () =>
      window.removeEventListener("__flexjar_consent_change__", handleConsentChange);
  }, []);

  return (
    <div
      style={{
        minHeight: "120vh",
        padding: "var(--a-spacing-12)",
        background: "var(--a-surface-subtle)",
        color: "var(--a-text-default)",
      }}
    >
      <div style={{ maxWidth: "640px", display: "grid", gap: "var(--a-spacing-4)" }}>
        <h2 style={{ margin: 0 }}>Designflate</h2>
        <p style={{ margin: 0 }}>
          Scroll litt for å se at docken holder seg i hjørnet. Bruk knappene under for å
          teste ulike scenarier.
        </p>
        <div style={{ display: "flex", gap: "var(--a-spacing-2)", flexWrap: "wrap" }}>
          <Button size="small" variant="secondary" onClick={handleReset}>
            Nullstill docken
          </Button>
          <Button
            size="small"
            variant={hasConsent ? "secondary" : "primary"}
            onClick={handleGrantConsent}
            disabled={hasConsent}
          >
            Gi samtykke
          </Button>
          <Button
            size="small"
            variant={!hasConsent ? "secondary" : "danger"}
            onClick={handleRevokeConsent}
            disabled={!hasConsent}
          >
            Fjern samtykke
          </Button>
        </div>
        <div
          style={{
            padding: "var(--a-spacing-4)",
            background: hasConsent
              ? "var(--a-surface-success-subtle)"
              : "var(--a-surface-warning-subtle)",
            borderRadius: "var(--a-border-radius-medium)",
          }}
        >
          <strong>Samtykke status:</strong> {hasConsent ? "Gitt ✓" : "Ikke gitt ✗"}
          <p style={{ margin: "var(--a-spacing-2) 0 0", fontSize: "0.875rem" }}>
            {hasConsent
              ? "Docken kan bruke localStorage til å huske at den ble lukket."
              : "Docken vises fortsatt, men kan ikke huske at den ble lukket (ingen localStorage-persistering)."}
          </p>
        </div>
        <div
          style={{
            padding: "var(--a-spacing-4)",
            background: "var(--a-surface-info-subtle)",
            borderRadius: "var(--a-border-radius-medium)",
            fontSize: "0.875rem",
          }}
        >
          <strong>Tips for testing:</strong>
          <ul
            style={{
              margin: "var(--a-spacing-2) 0 0",
              paddingLeft: "var(--a-spacing-6)",
            }}
          >
            <li>
              Med <code>hideAfterSubmit=true</code> (standard): Docken forsvinner helt
              etter innsending
            </li>
            <li>Bruk "Nullstill docken" for å vise den igjen etter innsending</li>
            <li>
              Uten samtykke: localStorage fungerer ikke, men docken vises fortsatt
            </li>
          </ul>
        </div>
      </div>
      <FlexJarDock key={resetToken} {...props} />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ExamplePage {...args} />,
};

export const StaysOpenAfterSubmit: Story = {
  render: Default.render,
  args: {
    feedbackId: "storybook-stays-open",
    hideAfterSubmit: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Med hideAfterSubmit={false} forblir docken synlig (minimert) etter innsending, slik at brukeren kan åpne den igjen. Dette gjør testing enklere.",
      },
    },
  },
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
    successBody:
      "Docken er nå skjult. Med samtykke vil den forbli skjult i 30 dager. Uten samtykke vil den vises igjen ved ny lasting av siden.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrerer hvordan docken skjules permanent etter innsending. Skjulevarighet avhenger av om brukeren har gitt samtykke.",
      },
    },
  },
};
