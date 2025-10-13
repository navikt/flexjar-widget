import { useCallback, useRef, useState } from "react";
import type {
  ChoiceOption,
  ChoiceQuestion,
  FlexJarAnswerValue,
  FlexJarError,
  FlexJarEvents,
  FlexJarQuestion,
  FlexJarStatus,
  FlexJarSubmission,
  FlexJarSubmitResult,
  FlexJarTransport,
  FlexJarTransportPayload,
  FlexJarValidationError,
  RatingQuestion,
} from "./types";

export interface UseFlexJarOptions {
  feedbackId: string;
  questions: FlexJarQuestion[];
  transport: FlexJarTransport;
  events?: FlexJarEvents;
  context?: Record<string, unknown>;
  initialAnswers?: Record<string, FlexJarAnswerValue>;
  coreQuestionIds?: {
    rating: string;
    main: string;
  };
}

export interface UseFlexJarReturn {
  answers: Record<string, FlexJarAnswerValue>;
  status: FlexJarStatus;
  error: FlexJarError | null;
  setAnswer: (
    questionId: string,
    value: FlexJarAnswerValue | null | undefined,
  ) => void;
  submit: () => Promise<FlexJarSubmitResult>;
  validate: () => string[];
  reset: () => void;
}

const DEFAULT_SCALE = 5;

export function useFlexJar(options: UseFlexJarOptions): UseFlexJarReturn {
  const {
    feedbackId,
    questions,
    transport,
    events,
    context,
    initialAnswers,
    coreQuestionIds,
  } = options;

  const initialAnswersRef = useRef<Record<string, FlexJarAnswerValue>>(
    initialAnswers ? cloneAnswers(initialAnswers) : {},
  );

  const [answers, setAnswers] = useState<Record<string, FlexJarAnswerValue>>(
    initialAnswersRef.current,
  );
  const [status, setStatus] = useState<FlexJarStatus>("idle");
  const [error, setError] = useState<FlexJarError | null>(null);

  const startedAtRef = useRef<string>(new Date().toISOString());

  const setAnswer = useCallback(
    (
      questionId: string,
      value: FlexJarAnswerValue | null | undefined,
    ) => {
      setAnswers((prev: Record<string, FlexJarAnswerValue>) => {
        const next = { ...prev };
        if (shouldDropValue(value)) {
          delete next[questionId];
        } else {
          const safeValue = value as FlexJarAnswerValue;
          next[questionId] = cloneAnswerValue(safeValue);
        }
        return next;
      });

      events?.onAnswer?.(questionId, value);
    },
    [events],
  );

  const validate = useCallback((): string[] => {
    const missingIds: string[] = [];

    for (const question of questions) {
      if (!question.required) {
        continue;
      }

      const answer = answers[question.id];

      if (!isAnswerPresent(answer)) {
        missingIds.push(question.id);
        continue;
      }

      if (!isAnswerValidForQuestion(question, answer)) {
        missingIds.push(question.id);
      }
    }

    return missingIds;
  }, [answers, questions]);

  const submit = useCallback(async (): Promise<FlexJarSubmitResult> => {
    const missing = validate();

    if (missing.length > 0) {
      const validationError: FlexJarValidationError = {
        type: "validation",
        missing,
      };
      setStatus("error");
      setError(validationError);
      events?.onValidationFailed?.(missing);
      return { ok: false, error: validationError };
    }

    setStatus("submitting");
    setError(null);

    const answerSnapshot = cloneAnswers(answers);
    const submission: FlexJarSubmission = {
      feedbackId,
      answers: answerSnapshot,
      startedAt: startedAtRef.current,
      submittedAt: new Date().toISOString(),
      context: context ? { ...context } : undefined,
      transportPayload: buildTransportPayload(
        feedbackId,
        answerSnapshot,
        coreQuestionIds,
      ),
    };

    events?.onSubmitStart?.(submission);

    try {
      await transport.submit(submission);
      setStatus("success");
      setError(null);
      events?.onSubmitSuccess?.(submission);
      return { ok: true, submission };
    } catch (cause) {
      const transportError: FlexJarError = { type: "transport", cause };
      setStatus("error");
      setError(transportError);
      events?.onSubmitError?.(cause);
      return { ok: false, error: transportError };
    }
  }, [
    answers,
    context,
    events,
    feedbackId,
    transport,
    validate,
    coreQuestionIds,
  ]);

  const reset = useCallback(() => {
    const nextInitial = cloneAnswers(initialAnswersRef.current);
    setAnswers(nextInitial);
    setStatus("idle");
    setError(null);
    startedAtRef.current = new Date().toISOString();
    events?.onReset?.();
  }, [events]);

  return {
    answers,
    status,
    error,
    setAnswer,
    submit,
    validate,
    reset,
  };
}

function shouldDropValue(
  value: FlexJarAnswerValue | null | undefined,
): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return true;
  }

  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  return false;
}

function cloneAnswerValue(value: FlexJarAnswerValue): FlexJarAnswerValue {
  if (Array.isArray(value)) {
    return [...value];
  }

  return value;
}

function cloneAnswers(
  source: Record<string, FlexJarAnswerValue>,
): Record<string, FlexJarAnswerValue> {
  const copy: Record<string, FlexJarAnswerValue> = {};
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (value !== undefined) {
      copy[key] = cloneAnswerValue(value);
    }
  }
  return copy;
}

function buildTransportPayload(
  feedbackId: string,
  answers: Record<string, FlexJarAnswerValue>,
  coreQuestionIds?: { rating: string; main: string },
): FlexJarTransportPayload {
  const payload: FlexJarTransportPayload = {
    feedbackId,
    ...answers,
  };

  if (coreQuestionIds) {
    const ratingValue = answers[coreQuestionIds.rating];
    const mainValue = answers[coreQuestionIds.main];

    const svar = coerceRatingAnswer(ratingValue);
    if (svar !== undefined) {
      payload.svar = svar;
    }

    const feedback = coerceFeedbackAnswer(mainValue);
    if (feedback !== undefined) {
      payload.feedback = feedback;
    }
  }

  return payload;
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

function isAnswerPresent(
  value: FlexJarAnswerValue | undefined,
): value is FlexJarAnswerValue {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function isAnswerValidForQuestion(
  question: FlexJarQuestion,
  rawAnswer: FlexJarAnswerValue,
): boolean {
  switch (question.type) {
    case "rating":
      return isValidRatingAnswer(question, rawAnswer);
    case "text":
      return typeof rawAnswer === "string";
    case "singleChoice":
      return isValidSingleChoiceAnswer(question, rawAnswer);
    case "multiChoice":
      return isValidMultiChoiceAnswer(question, rawAnswer);
    default:
      return true;
  }
}

function isValidRatingAnswer(
  question: RatingQuestion,
  rawAnswer: FlexJarAnswerValue,
): boolean {
  const scale = question.scale ?? DEFAULT_SCALE;
  const numeric = typeof rawAnswer === "number" ? rawAnswer : Number(rawAnswer);
  if (Number.isNaN(numeric)) {
    return false;
  }
  return numeric >= 1 && numeric <= scale;
}

function isValidSingleChoiceAnswer(
  question: ChoiceQuestion & { type: "singleChoice" },
  rawAnswer: FlexJarAnswerValue,
): boolean {
  if (typeof rawAnswer !== "string") {
    return false;
  }

  return question.options.some(({ value }: ChoiceOption) => value === rawAnswer);
}

function isValidMultiChoiceAnswer(
  question: ChoiceQuestion & { type: "multiChoice" },
  rawAnswer: FlexJarAnswerValue,
): boolean {
  if (!Array.isArray(rawAnswer)) {
    return false;
  }

  if (rawAnswer.length === 0) {
    return false;
  }

  const optionValues = new Set(
    question.options.map(({ value }: ChoiceOption) => value),
  );
  return rawAnswer.every(
    (value) => typeof value === "string" && optionValues.has(value),
  );
}
