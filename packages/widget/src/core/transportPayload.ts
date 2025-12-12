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
): FlexJarTransportPayload {
  const payload: FlexJarTransportPayload = {
    feedbackId,
  };

  // Add survey type if provided
  if (surveyType) {
    payload.surveyType = surveyType;
  }

  // Add all answers
  for (const [questionId, answerValue] of Object.entries(answers)) {
    // Skip if this would overwrite feedbackId or surveyType
    if (questionId === "feedbackId" || questionId === "surveyType") {
      continue;
    }
    payload[questionId] = answerValue;
  }

  // Add question prompts with question__ prefix
  for (const question of questions) {
    payload[`${QUESTION_TEXT_PREFIX}${question.id}`] = question.prompt;
  }

  return payload;
}


