import { useCallback, useState } from "react";
import type {
  FlexJarAnswerValue,
  FlexJarError,
  FlexJarEvents,
  FlexJarQuestion,
  FlexJarStatus,
  FlexJarSubmission,
  FlexJarSubmitResult,
  FlexJarTransport,
  FlexJarValidationError,
  SurveyType,
} from "./types";
import { useAnswerState, cloneAnswers } from "./answers.js";
import { validateAnswers } from "./validation.js";
import { buildTransportPayload } from "./transportPayload.js";

export interface UseFlexJarOptions {
  feedbackId: string;
  questions: FlexJarQuestion[];
  transport: FlexJarTransport;
  events?: FlexJarEvents;
  context?: Record<string, unknown>;
  /** Custom metadata for segmentation/filtering in analytics (e.g. { harDialogmote: true }) */
  metadata?: Record<string, unknown>;
  initialAnswers?: Record<string, FlexJarAnswerValue>;

  surveyType?: SurveyType;
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

export function useFlexJar(options: UseFlexJarOptions): UseFlexJarReturn {
  const {
    feedbackId,
    questions,
    transport,
    events,
    context,
    metadata,
    initialAnswers,
    surveyType,
  } = options;

  const { answers, setAnswer, resetAnswers, startedAtRef } = useAnswerState({
    initialAnswers,
    onAnswer: events?.onAnswer,
  });
  const [status, setStatus] = useState<FlexJarStatus>("idle");
  const [error, setError] = useState<FlexJarError | null>(null);

  const validate = useCallback((): string[] => {
    return validateAnswers(questions, answers);
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
        questions,
        surveyType,
        metadata,
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
    questions,
    transport,
    validate,
    startedAtRef,
  ]);

  const reset = useCallback(() => {
    resetAnswers();
    setStatus("idle");
    setError(null);
    events?.onReset?.();
  }, [events, resetAnswers]);

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
