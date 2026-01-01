import type { FlexJarQuestion } from "../core/types.js";
import type { FlexJarSurveyConfig } from "../components/surveyTypes.js";

/**
 * Creates a standard rating survey with rating scale and text feedback.
 * This produces the same behavior as the pre-refactor widget.
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
 * Creates a Top Tasks survey for measuring task completion success.
 * Users select what they were trying to do and whether they succeeded.
 */
export function createTopTasksSurvey(options: {
  taskPrompt?: string;
  tasks: Array<{ value: string; label: string }>;
  successPrompt?: string;
  blockerPrompt?: string;
  includeBlockerQuestion?: boolean;
  /** Include "Noe annet" option with free-text follow-up for task discovery */
  includeOtherTask?: boolean;
  otherTaskPrompt?: string;
}): FlexJarSurveyConfig {
  // Build task options, optionally including "Annet"
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

  // Add "Other task" free-text question when includeOtherTask is enabled
  if (options.includeOtherTask) {
    questions.push({
      id: "otherTask",
      type: "text",
      prompt: options.otherTaskPrompt ?? "Beskriv hva du prøvde å gjøre",
      required: false,
      // Note: showIf logic would need to be implemented in the widget renderer
      // For now, this field can be left empty if "other" was not selected
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
 * Creates a Discovery survey for free-text task identification.
 * Users describe what they came to do in their own words.
 * This is used to discover which tasks should be offered in Top Tasks surveys.
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
 * Creates a Task Priority survey for ranking which tasks matter most.
 * Classic McGovern methodology: users select their top N tasks from a list.
 * Requires 400+ responses for statistical significance.
 *
 * @param options.tasks - Full list of tasks to choose from (20-50 recommended)
 * @param options.maxSelections - How many tasks users can select (default: 5)
 * @param options.randomize - Randomize option order per user (default: true, critical for validity)
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
      randomize: options.randomize ?? true, // Critical for validity!
    },
  ];

  return {
    type: "taskPriority",
    questions,
    gateQuestionId: "priorities",
  };
}
