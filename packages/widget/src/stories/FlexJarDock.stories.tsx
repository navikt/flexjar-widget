import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@navikt/ds-react";
import { FlexJarDock, type FlexJarDockProps } from "../components/FlexJarDock";
import type { FlexJarSurveyConfig } from "../components/surveyTypes.js";
import { removeConsentValue } from "../components/shared/consentStorage.js";
import {
  DEFAULT_SURVEY_RATING,
  DEFAULT_SURVEY_SERVICE_FEEDBACK,
  DEFAULT_SURVEY_DISCOVERY,
  createTopTasksSurvey,
  createTaskPrioritySurvey,
} from "../presets/index.js";

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

// ============================================
// Survey Configurations (matching flexjar-analytics mock data)
// ============================================

// Tasks matching flexjar-analytics mock data for Top Tasks surveys
const MOCK_TASKS = [
  { value: "apply_sick_leave", label: "Søke om sykepenger" },
  { value: "check_status", label: "Sjekke status på søknad" },
  { value: "upload_docs", label: "Laste opp vedlegg" },
  { value: "contact_nav", label: "Kontakte NAV" },
  { value: "find_info", label: "Finne informasjon" },
];

const TOP_TASKS_SURVEY = createTopTasksSurvey({
  tasks: MOCK_TASKS,
  includeBlockerQuestion: true,
  includeOtherTask: true,
});

// Task Priority survey (for McGovern methodology)
const TASK_PRIORITY_SURVEY = createTaskPrioritySurvey({
  tasks: MOCK_TASKS,
  maxSelections: 3,
});

const CUSTOM_SURVEY: FlexJarSurveyConfig = {
  type: "custom",
  questions: [
    {
      id: "role",
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
      id: "ease_of_use",
      type: "rating",
      prompt: "Hvor enkelt var det å finne frem?",
      required: true,
      scale: 5,
    },
    {
      id: "comment",
      type: "text",
      prompt: "Har du andre tilbakemeldinger?",
      required: false,
    },
  ],
};

const SUCCESS_TRANSPORT: FlexJarDockProps["transport"] = {
  async submit(submission) {
    await delay(800);
    console.info("Simulert innsending", submission);
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

const ExamplePage = (props: FlexJarDockProps) => {
  const [resetToken, setResetToken] = useState(0);
  const [hasConsent, setHasConsent] = useState(() => {
    const stored = localStorage.getItem("__flexjar_storybook_consent__");
    return stored === null ? true : stored === "true";
  });

  const handleReset = useCallback(() => {
    void (async () => {
      await removeConsentValue(`flexjar-dismissed-${props.feedbackId}`);
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
        padding: "var(--ax-space-48)",
        background: "var(--ax-bg-neutral-soft)",
        color: "var(--ax-text-neutral)",
      }}
    >
      <div style={{ maxWidth: "640px", display: "grid", gap: "var(--ax-space-16)" }}>
        <h2 style={{ margin: 0 }}>Designflate</h2>
        <p style={{ margin: 0 }}>
          Scroll litt for å se at docken holder seg i hjørnet. Bruk knappene under for å
          teste ulike scenarier.
        </p>
        <div style={{ display: "flex", gap: "var(--ax-space-8)", flexWrap: "wrap" }}>
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
            padding: "var(--ax-space-16)",
            background: hasConsent
              ? "var(--ax-bg-success-soft)"
              : "var(--ax-bg-warning-soft)",
            borderRadius: "var(--ax-radius-4)",
          }}
        >
          <strong>Samtykke status:</strong> {hasConsent ? "Gitt ✓" : "Ikke gitt ✗"}
          <p style={{ margin: "var(--ax-space-8) 0 0", fontSize: "0.875rem" }}>
            {hasConsent
              ? "Docken kan bruke localStorage til å huske at den ble lukket."
              : "Docken vises fortsatt, men kan ikke huske at den ble lukket (ingen localStorage-persistering)."}
          </p>
        </div>
        <div
          style={{
            padding: "var(--ax-space-16)",
            background: "var(--ax-bg-info-soft)",
            borderRadius: "var(--ax-radius-4)",
            fontSize: "0.875rem",
          }}
        >
          <strong>Tips for testing:</strong>
          <ul
            style={{
              margin: "var(--ax-space-8) 0 0",
              paddingLeft: "var(--ax-space-24)",
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

export const Rating: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    feedbackId: "storybook-service",
    survey: DEFAULT_SURVEY_SERVICE_FEEDBACK,
    // Context example matching analytics mock data format for sykefraværsoppfølging
    context: {
      app: "syfo-oppfolgingsplan-frontend",
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

export const Discovery: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    feedbackId: "storybook-discovery",
    survey: DEFAULT_SURVEY_DISCOVERY,
  },
  parameters: {
    docs: {
      description: {
        story: "Discovery-undersøkelse med `DEFAULT_SURVEY_DISCOVERY` preset. Brukes til å finne hvilke oppgaver brukere kommer for.",
      },
    },
  },
};

export const TopTasks: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    feedbackId: "storybook-top-tasks",
    survey: TOP_TASKS_SURVEY,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Top Tasks-undersøkelse for å måle suksessrate på oppgaver. Bruker `createTopTasksSurvey` med oppgaveliste.",
      },
    },
  },
};

export const TaskPriority: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    feedbackId: "storybook-task-priority",
    survey: TASK_PRIORITY_SURVEY,
  },
  parameters: {
    docs: {
      description: {
        story:
          "McGovern Task Priority-undersøkelse. Brukere velger sine viktigste oppgaver. Bruker `createTaskPrioritySurvey`.",
      },
    },
  },
};

export const CustomSurvey: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    feedbackId: "storybook-custom",
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

/**
 * Survey with branching logic - demonstrates skip logic based on answers and metadata.
 * When the user answers "Yes" to the first question, it skips to the positive follow-up.
 * When the user answers "No", it shows a follow-up question about what went wrong.
 */
const BRANCHING_SURVEY: FlexJarSurveyConfig = {
  type: "custom",
  questions: [
    {
      id: "solved_task",
      type: "singleChoice",
      prompt: "Fikk du gjort det du kom for?",
      description: "Vi bruker svaret til å forbedre tjenesten",
      required: true,
      options: [
        { value: "YES", label: "Ja" },
        { value: "PARTIAL", label: "Delvis" },
        { value: "NO", label: "Nei" },
      ],
      logic: [
        {
          // If answered YES, skip to the positive rating question
          condition: { field: "ANSWER", operator: "EQ", value: "YES" },
          action: { type: "JUMP_TO", targetId: "positive_rating" },
        },
        // If NO or PARTIAL, fall through to next question (blocker follow-up)
      ],
    },
    {
      id: "blocker",
      type: "singleChoice",
      prompt: "Hva var det som stoppet deg?",
      required: true,
      options: [
        { value: "tech_error", label: "Teknisk feil" },
        { value: "confusing", label: "Vanskelig å forstå" },
        { value: "missing_info", label: "Manglet informasjon" },
        { value: "other", label: "Noe annet" },
      ],
    },
    {
      id: "blocker_details",
      type: "text",
      prompt: "Kan du fortelle mer om hva som skjedde?",
      required: false,
      placeholder: "Beskriv problemet så godt du kan...",
    },
    {
      id: "positive_rating",
      type: "rating",
      prompt: "Hvor fornøyd er du med tjenesten?",
      scale: 5,
      required: true,
    },
    {
      id: "final_comment",
      type: "text",
      prompt: "Har du andre tilbakemeldinger?",
      required: false,
    },
  ],
};

export const BranchingLogic: Story = {
  render: (args) => <ExamplePage {...args} />,
  args: {
    feedbackId: "storybook-branching",
    survey: BRANCHING_SURVEY,
  },
  parameters: {
    docs: {
      description: {
        story: `**Branching Logic / Skip Logic Demo**

Denne historien demonstrerer kondisjonell navigasjon:
- Svar "Ja" → hopper over oppfølgingsspørsmålet og rett til rating
- Svar "Nei" eller "Delvis" → viser oppfølgingsspørsmål om hva som var problemet

Branching aktiveres automatisk når spørsmål har \`logic\` definert.`,
      },
    },
  },
};
