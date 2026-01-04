import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
  FlexJarTransportPayload,
  SurveyType,
  ChoiceOption,
  TransportAnswer,
} from "./types";

/**
 * Infers the survey type from the question structure.
 * This ensures analytics always gets a valid surveyType even if not explicitly set.
 */
export function inferSurveyType(questions: FlexJarQuestion[]): SurveyType {
  // Check for Discovery pattern: has "discoveredTask" text field
  const hasDiscoveredTask = questions.some(
    (q) => q.id === "discoveredTask" && q.type === "text"
  );
  if (hasDiscoveredTask) return "discovery";

  // Check for TopTasks pattern: has "task" single choice + "taskSuccess"
  const hasTask = questions.some(
    (q) => q.id === "task" && q.type === "singleChoice"
  );
  const hasTaskSuccess = questions.some(
    (q) => q.id === "taskSuccess" && q.type === "singleChoice"
  );
  if (hasTask && hasTaskSuccess) return "topTasks";

  // Check for TaskPriority pattern: has "priorities" multi choice
  const hasPriorities = questions.some(
    (q) => q.id === "priorities" && q.type === "multiChoice"
  );
  if (hasPriorities) return "taskPriority";

  // Check for Rating pattern: has a rating question
  const hasRating = questions.some((q) => q.type === "rating");
  if (hasRating) return "rating";

  // Default fallback
  return "custom";
}

export function buildTransportPayload(
  feedbackId: string,
  answers: Record<string, FlexJarAnswerValue>,
  questions: FlexJarQuestion[],
  surveyType?: SurveyType,
  metadata?: Record<string, unknown>,
  startedAt?: string,
  submittedAt?: string,
): FlexJarTransportPayload {
  const payload: FlexJarTransportPayload = {
    feedbackId,
  };

  // Add survey type - use provided or infer from questions
  const resolvedSurveyType = surveyType ?? inferSurveyType(questions);
  payload.surveyType = resolvedSurveyType;

  // Add custom metadata if provided
  if (metadata && Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }

  // Calculate and add time to complete if both timestamps are available
  if (startedAt && submittedAt) {
    const startTime = new Date(startedAt).getTime();
    const endTime = new Date(submittedAt).getTime();
    const timeToCompleteMs = endTime - startTime;

    // Only add if it's a reasonable value (between 1 second and 30 minutes)
    if (timeToCompleteMs > 1000 && timeToCompleteMs < 1800000) {
      payload.timeToCompleteMs = timeToCompleteMs;
    }
  }

  // Add all answers as flat keys (legacy format)
  for (const [questionId, answerValue] of Object.entries(answers)) {
    // Skip if this would overwrite feedbackId or surveyType
    if (questionId === "feedbackId" || questionId === "surveyType") {
      continue;
    }
    payload[questionId] = answerValue;
  }

  // Add structured answers array (rich metadata for analytics)
  const answersList: TransportAnswer[] = [];

  for (const question of questions) {
    const value = answers[question.id];
    // Skip if unanswered
    if (value === undefined || value === null || value === "") continue;

    let fieldType: TransportAnswer["fieldType"] = "TEXT";
    let answerValue: TransportAnswer["value"] = { type: "text", text: String(value) };

    // Use proper type narrowing based on question.type
    switch (question.type) {
      case "rating":
        fieldType = "RATING";
        answerValue = { type: "rating", rating: Number(value) };
        break;
      case "multiChoice":
        fieldType = "MULTI_CHOICE";
        answerValue = {
          type: "multiChoice",
          selectedOptionIds: Array.isArray(value) ? value : [String(value)],
        };
        break;
      case "singleChoice":
        fieldType = "SINGLE_CHOICE";
        answerValue = { type: "singleChoice", selectedOptionId: String(value) };
        break;
      case "text":
      default:
        fieldType = "TEXT";
        answerValue = { type: "text", text: String(value) };
        break;
    }

    // Extract options if they exist on the question (for choice types)
    let options: Array<{ id: string; label: string }> | null = null;
    if ("options" in question && question.options) {
      options = question.options.map((opt: ChoiceOption) => ({
        id: opt.value,
        label: opt.label,
      }));
    }

    answersList.push({
      fieldId: question.id,
      fieldType: fieldType,
      question: {
        label: question.prompt,
        description: question.description ?? null,
        options: options,
      },
      value: answerValue,
    });
  }

  payload.answers = answersList;

  return payload;
}
