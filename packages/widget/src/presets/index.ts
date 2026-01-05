import type { FlexJarQuestion, TextQuestion } from "../core/types.js";
import type { FlexJarSurveyConfig } from "../components/surveyTypes.js";

// ============================================
// Default Survey Presets
// ============================================

/**
 * Default rating survey: 5-star rating with optional text follow-up.
 * 
 * @example
 * ```tsx
 * import { FlexJarDock, DEFAULT_SURVEY_RATING } from "@navikt/flexjar-widget";
 * 
 * <FlexJarDock
 *   feedbackId="my-app-feedback"
 *   survey={DEFAULT_SURVEY_RATING}
 *   transport={transport}
 * />
 * ```
 */
export const DEFAULT_SURVEY_RATING: FlexJarSurveyConfig = {
  type: "rating",
  questions: [
    {
      id: "rating",
      type: "rating",
      prompt: "Hvordan var opplevelsen din?",
      description: "1 er dårlig, 5 er bra",
      required: true,
      scale: 5,
    } as FlexJarQuestion,
    {
      id: "feedback",
      type: "text",
      prompt: "Har du andre tilbakemeldinger?",
      required: false,
      maxLength: 1000,
    } as TextQuestion,
  ],
  gateQuestionId: "rating",
};

/**
 * Default discovery survey: Free-text task identification with success question.
 * Use this to discover what tasks users come to your site for.
 * 
 * @example
 * ```tsx
 * import { FlexJarDock, DEFAULT_SURVEY_DISCOVERY } from "@navikt/flexjar-widget";
 * 
 * <FlexJarDock
 *   feedbackId="discovery-feedback"
 *   survey={DEFAULT_SURVEY_DISCOVERY}
 *   transport={transport}
 * />
 * ```
 */
export const DEFAULT_SURVEY_DISCOVERY: FlexJarSurveyConfig = {
  type: "discovery",
  questions: [
    {
      id: "discoveredTask",
      type: "text",
      prompt: "Hva kom du hit for å gjøre i dag?",
      placeholder: "Beskriv med dine egne ord...",
      required: true,
      minRows: 2,
    } as FlexJarQuestion,
    {
      id: "taskSuccess",
      type: "singleChoice",
      prompt: "Fikk du gjort det?",
      options: [
        { value: "yes", label: "Ja" },
        { value: "partial", label: "Delvis" },
        { value: "no", label: "Nei" },
      ],
      required: true,
    } as FlexJarQuestion,
    {
      id: "blocker",
      type: "text",
      prompt: "Hva hindret deg? (valgfritt)",
      required: false,
    } as FlexJarQuestion,
  ],
  gateQuestionId: "discoveredTask",
};

// ============================================
// Survey Builder Functions
// ============================================

/**
 * Creates a rating survey with customizable prompts.
 */
export function createRatingSurvey(options: {
  ratingPrompt: string;
  ratingDescription?: string;
  followUpQuestions?: FlexJarQuestion[];
}): FlexJarSurveyConfig {
  const questions: FlexJarQuestion[] = [
    {
      id: "rating",
      type: "rating",
      prompt: options.ratingPrompt,
      description: options.ratingDescription,
      required: true,
    },
  ];

  if (options.followUpQuestions) {
    questions.push(...options.followUpQuestions);
  }

  return {
    type: "rating",
    questions,
    gateQuestionId: "rating",
  };
}

/**
 * Creates a Discovery survey for free-text task identification.
 * Use this to discover what tasks users come to your site for.
 */
export function createDiscoverySurvey(options?: {
  taskPrompt?: string;
  taskPlaceholder?: string;
  successPrompt?: string;
  blockerPrompt?: string;
  includeBlockerQuestion?: boolean;
}): FlexJarSurveyConfig {
  const questions: FlexJarQuestion[] = [
    {
      id: "discoveredTask",
      type: "text",
      prompt: options?.taskPrompt ?? "Hva kom du hit for å gjøre i dag?",
      placeholder: options?.taskPlaceholder ?? "Beskriv med dine egne ord...",
      required: true,
      minRows: 2,
    },
    {
      id: "taskSuccess",
      type: "singleChoice",
      prompt: options?.successPrompt ?? "Fikk du gjort det?",
      options: [
        { value: "yes", label: "Ja" },
        { value: "partial", label: "Delvis" },
        { value: "no", label: "Nei" },
      ],
      required: true,
    },
  ];

  if (options?.includeBlockerQuestion !== false) {
    questions.push({
      id: "blocker",
      type: "text",
      prompt: options?.blockerPrompt ?? "Hva hindret deg? (valgfritt)",
      required: false,
    });
  }

  return {
    type: "discovery",
    questions,
    gateQuestionId: "discoveredTask",
  };
}

/**
 * Creates a Top Tasks survey for measuring task completion success.
 * 
 * Note: Tasks must be provided as they are domain-specific.
 * There is no DEFAULT_SURVEY_TOP_TASKS since tasks vary per application.
 * 
 * @example
 * ```tsx
 * const survey = createTopTasksSurvey({
 *   tasks: [
 *     { value: "apply", label: "Søke om sykepenger" },
 *     { value: "status", label: "Sjekke status på søknad" },
 *   ]
 * });
 * ```
 */
export function createTopTasksSurvey(options: {
  taskPrompt?: string;
  tasks: Array<{ value: string; label: string }>;
  successPrompt?: string;
  blockerPrompt?: string;
  includeBlockerQuestion?: boolean;
  includeOtherTask?: boolean;
  otherTaskPrompt?: string;
}): FlexJarSurveyConfig {
  const taskOptions = options.includeOtherTask
    ? [...options.tasks, { value: "other", label: "Noe annet" }]
    : options.tasks;

  const questions: FlexJarQuestion[] = [
    {
      id: "task",
      type: "singleChoice",
      prompt: options.taskPrompt ?? "Hva prøvde du å gjøre i dag?",
      options: taskOptions,
      required: true,
    },
    {
      id: "taskSuccess",
      type: "singleChoice",
      prompt: options.successPrompt ?? "Klarte du det?",
      options: [
        { value: "yes", label: "Ja" },
        { value: "partial", label: "Delvis" },
        { value: "no", label: "Nei" },
      ],
      required: true,
    },
  ];

  if (options.includeOtherTask) {
    questions.push({
      id: "otherTask",
      type: "text",
      prompt: options.otherTaskPrompt ?? "Beskriv hva du prøvde å gjøre",
      required: false,
    });
  }

  if (options.includeBlockerQuestion !== false) {
    questions.push({
      id: "blocker",
      type: "text",
      prompt: options.blockerPrompt ?? "Hva hindret deg? (valgfritt)",
      required: false,
    });
  }

  return {
    type: "topTasks",
    questions,
    gateQuestionId: "task",
  };
}

/**
 * Creates a Task Priority survey for ranking which tasks matter most.
 * Classic McGovern methodology: users select their top N tasks from a list.
 * 
 * Note: Tasks must be provided as they are domain-specific.
 * There is no DEFAULT_SURVEY_TASK_PRIORITY since tasks vary per application.
 * 
 * @param options.tasks - Full list of tasks (20-50 recommended)
 * @param options.maxSelections - How many to select (default: 5)
 * @param options.randomize - Randomize order (default: true, critical for validity)
 * 
 * @example
 * ```tsx
 * const survey = createTaskPrioritySurvey({
 *   tasks: [
 *     { value: "apply", label: "Søke om sykepenger" },
 *     { value: "status", label: "Sjekke status" },
 *     // ... 20-50 tasks
 *   ]
 * });
 * ```
 */
export function createTaskPrioritySurvey(options: {
  prompt?: string;
  tasks: Array<{ value: string; label: string }>;
  maxSelections?: number;
  randomize?: boolean;
}): FlexJarSurveyConfig {
  const maxSelections = options.maxSelections ?? 5;

  const questions: FlexJarQuestion[] = [
    {
      id: "priorities",
      type: "multiChoice",
      prompt: options.prompt ?? `Velg de ${maxSelections} viktigste oppgavene for deg`,
      options: options.tasks,
      required: true,
      randomize: options.randomize ?? true,
    },
  ];

  return {
    type: "taskPriority",
    questions,
    gateQuestionId: "priorities",
  };
}
