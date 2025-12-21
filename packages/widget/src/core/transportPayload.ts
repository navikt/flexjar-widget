import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
  FlexJarTransportPayload,
  SurveyType,
} from "./types";
import {
  MAIN_ANSWER_KEY,
  RATING_ANSWER_KEY,
} from "../components/shared/canonicalSurvey.js";

const QUESTION_TEXT_PREFIX = "question__";

export function buildTransportPayload(
  feedbackId: string,
  answers: Record<string, FlexJarAnswerValue>,
  questions: FlexJarQuestion[],
  surveyType?: SurveyType,
  metadata?: Record<string, unknown>,
): FlexJarTransportPayload {
  const payload: FlexJarTransportPayload = {
    feedbackId,
  };

  // Add survey type if provided
  if (surveyType) {
    payload.surveyType = surveyType;
  }

  // Add custom metadata if provided
  if (metadata && Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }

  // Add all answers
  for (const [questionId, answerValue] of Object.entries(answers)) {
    // Skip if this would overwrite feedbackId or surveyType
    if (questionId === "feedbackId" || questionId === "surveyType") {
      continue;
    }
    payload[questionId] = answerValue;
  }

  // Add structured answers array (rich metadata for analytics)
  const answersList: any[] = [];

  for (const question of questions) {
    const value = answers[question.id];
    // Skip if unanswered (unless we want to track unanswered?)
    // Actually, backend needs even Unanswered sometimes, but usually only answered.
    // Let's include if value is not null/undefined/empty string
    if (value === undefined || value === null || value === "") continue;

    let fieldType = "TEXT";
    let answerValue: any = { type: "text", text: String(value) };

    // Infer type from question or value
    // This is basic inference, ideally the widget knows the type better.
    // But for now we map based on shape.
    if (question.type === "rating") {
      fieldType = "RATING";
      answerValue = { type: "rating", rating: Number(value) };
    } else if (Array.isArray(value)) {
      fieldType = "MULTI_CHOICE";
      answerValue = { type: "multiChoice", selectedOptionIds: value };
    } else if ('options' in question && question.options) {
      // Likely single choice if it has options and is not array
      fieldType = "SINGLE_CHOICE";
      answerValue = { type: "singleChoice", selectedOptionId: String(value) };
    } else {
      // Default text
      fieldType = "TEXT";
      answerValue = { type: "text", text: String(value) };
    }

    answersList.push({
      fieldId: question.id,
      fieldType: fieldType,
      question: {
        label: question.prompt,
        description: (question as any).description || null, // Cast because description might not be in base type
        options: 'options' in question && question.options ? question.options.map((o: any) => ({ id: o.value, label: o.label })) : null
      },
      value: answerValue
    });
  }

  payload.answers = answersList;

  return payload;
}


