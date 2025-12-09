import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
  FlexJarTransportPayload,
} from "./types";
import {
  MAIN_ANSWER_KEY,
  RATING_ANSWER_KEY,
} from "../components/shared/canonicalSurvey.js";

const QUESTION_TEXT_PREFIX = "question__";

export interface CoreQuestionIds {
  rating: string;
  main: string;
}

export function buildTransportPayload(
  feedbackId: string,
  answers: Record<string, FlexJarAnswerValue>,
  questions: FlexJarQuestion[],
  coreQuestionIds?: CoreQuestionIds,
): FlexJarTransportPayload {
  const payload: FlexJarTransportPayload = {
    feedbackId,
  };

  const isCoreQuestion = (questionId: string): boolean => {
    if (!coreQuestionIds) {
      return false;
    }

    return (
      questionId === coreQuestionIds.rating || questionId === coreQuestionIds.main
    );
  };

  for (const [questionId, answerValue] of Object.entries(answers)) {
    if (isCoreQuestion(questionId)) {
      continue;
    }

    payload[questionId] = answerValue;
  }

  for (const question of questions) {
    const transportKey = resolveTransportQuestionKey(
      question.id,
      coreQuestionIds,
    );
    payload[`${QUESTION_TEXT_PREFIX}${transportKey}`] = question.prompt;
  }

  if (coreQuestionIds) {
    const ratingValue = answers[coreQuestionIds.rating];
    const mainValue = answers[coreQuestionIds.main];

    const svar = coerceRatingAnswer(ratingValue);
    if (svar !== undefined) {
      payload[RATING_ANSWER_KEY] = svar;
    }

    const feedback = coerceFeedbackAnswer(mainValue);
    if (feedback !== undefined) {
      payload[MAIN_ANSWER_KEY] = feedback;
    }
  }

  return payload;
}

function resolveTransportQuestionKey(
  questionId: string,
  coreQuestionIds?: CoreQuestionIds,
): string {
  if (!coreQuestionIds) {
    return questionId;
  }

  if (questionId === coreQuestionIds.rating) {
    return RATING_ANSWER_KEY;
  }

  if (questionId === coreQuestionIds.main) {
    return MAIN_ANSWER_KEY;
  }

  return questionId;
}

function coerceRatingAnswer(
  value: FlexJarAnswerValue | undefined,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
}

function coerceFeedbackAnswer(
  value: FlexJarAnswerValue | undefined,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}
