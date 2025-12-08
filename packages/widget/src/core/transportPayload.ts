import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
  FlexJarTransportPayload,
  TransportAnswer,
  TransportFieldType,
  TransportQuestion,
  TransportAnswerValue,
  TransportContext,
  DeviceType,
  ChoiceQuestion,
} from "./types";
import {
  MAIN_ANSWER_KEY,
  RATING_ANSWER_KEY,
} from "../components/shared/canonicalSurvey.js";

export interface CoreQuestionIds {
  rating: string;
  main: string;
}

export interface BuildTransportPayloadOptions {
  feedbackId: string;
  surveyVersion?: string;
  answers: Record<string, FlexJarAnswerValue>;
  questions: FlexJarQuestion[];
  coreQuestionIds?: CoreQuestionIds;
  /** If true, collect browser context (requires user consent) */
  collectContext?: boolean;
}

export function buildTransportPayload(
  feedbackId: string,
  answers: Record<string, FlexJarAnswerValue>,
  questions: FlexJarQuestion[],
  _coreQuestionIds?: CoreQuestionIds,
  options?: { surveyVersion?: string; collectContext?: boolean },
): FlexJarTransportPayload {
  const structuredAnswers: TransportAnswer[] = [];

  for (const question of questions) {
    const answerValue = answers[question.id];
    if (answerValue === undefined || answerValue === null) {
      continue;
    }

    const transportAnswer = buildTransportAnswer(question, answerValue);
    if (transportAnswer) {
      structuredAnswers.push(transportAnswer);
    }
  }

  const payload: FlexJarTransportPayload = {
    feedbackId,
    surveyId: feedbackId,
    answers: structuredAnswers,
  };

  if (options?.surveyVersion) {
    payload.surveyVersion = options.surveyVersion;
  }

  // Collect context only if explicitly enabled (consent given)
  if (options?.collectContext && typeof window !== "undefined") {
    payload.context = buildContext();
  }

  return payload;
}

function buildContext(): TransportContext {
  const context: TransportContext = {};

  if (typeof window !== "undefined") {
    context.url = window.location.href;
    context.pathname = window.location.pathname;
    context.viewportWidth = window.innerWidth;
    context.deviceType = getDeviceType(window.innerWidth);
  }

  return context;
}

function getDeviceType(viewportWidth: number): DeviceType {
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth < 1024) return "tablet";
  return "desktop";
}

function buildTransportAnswer(
  question: FlexJarQuestion,
  answerValue: FlexJarAnswerValue,
): TransportAnswer | null {
  const fieldType = mapQuestionTypeToFieldType(question.type);
  const transportQuestion = buildTransportQuestion(question);
  const value = buildTransportValue(question.type, answerValue);

  if (!value) {
    return null;
  }

  return {
    fieldId: question.analyticsId ?? question.id,
    fieldType,
    question: transportQuestion,
    value,
  };
}

function mapQuestionTypeToFieldType(
  questionType: FlexJarQuestion["type"],
): TransportFieldType {
  switch (questionType) {
    case "rating":
      return "RATING";
    case "text":
      return "TEXT";
    case "singleChoice":
      return "SINGLE_CHOICE";
    case "multiChoice":
      return "MULTI_CHOICE";
  }
}

function buildTransportQuestion(question: FlexJarQuestion): TransportQuestion {
  const base: TransportQuestion = {
    label: question.prompt,
  };

  if (question.description) {
    base.description = question.description;
  }

  if (question.type === "singleChoice" || question.type === "multiChoice") {
    const choiceQuestion = question as ChoiceQuestion;
    base.options = choiceQuestion.options.map((opt) => ({
      id: opt.value,
      label: opt.label,
    }));
  }

  return base;
}

function buildTransportValue(
  questionType: FlexJarQuestion["type"],
  answerValue: FlexJarAnswerValue,
): TransportAnswerValue | null {
  switch (questionType) {
    case "rating": {
      const rating = coerceRatingAnswer(answerValue);
      if (rating === undefined) return null;
      return { type: "rating", rating };
    }
    case "text": {
      const text = coerceFeedbackAnswer(answerValue);
      if (!text) return null;
      return { type: "text", text };
    }
    case "singleChoice": {
      if (typeof answerValue !== "string") return null;
      return { type: "singleChoice", selectedOptionId: answerValue };
    }
    case "multiChoice": {
      if (!Array.isArray(answerValue)) return null;
      return { type: "multiChoice", selectedOptionIds: answerValue };
    }
  }
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
