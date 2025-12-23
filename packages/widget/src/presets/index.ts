import type { FlexJarQuestion } from "../core/types.js";
import type { FlexJarSurveyConfig } from "../components/surveyTypes.js";

/**
 * Creates a standard rating survey with rating scale and text feedback.
 * This produces the same behavior as the pre-refactor widget.
 */
export function createRatingSurvey(options: {
    ratingPrompt: string;
    ratingDescription?: string;
    textPrompt: string;
    textPlaceholder?: string;
    textRequired?: boolean;
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
        {
            id: "feedback",
            type: "text",
            prompt: options.textPrompt,
            placeholder: options.textPlaceholder,
            required: options.textRequired ?? false,
        },
        ...(options.followUpQuestions ?? []),
    ];

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
}): FlexJarSurveyConfig {
    const questions: FlexJarQuestion[] = [
        {
            id: "task",
            type: "singleChoice",
            prompt: options.taskPrompt ?? "Hva prøvde du å gjøre i dag?",
            options: options.tasks,
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
