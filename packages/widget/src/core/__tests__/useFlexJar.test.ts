import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useFlexJar } from "../useFlexJar.js";
import type {
  FlexJarQuestion,
  FlexJarTransport,
  FlexJarSubmission,
  FlexJarSubmitResult,
  FlexJarEvents,
  FlexJarAnswerValue,
} from "../types.js";

const requiredQuestions: FlexJarQuestion[] = [
  {
    id: "rating",
    type: "rating",
    prompt: "Hvor fornøyd er du?",
    required: true,
    scale: 5,
  },
  {
    id: "feedback",
    type: "text",
    prompt: "Hva kan vi forbedre?",
    required: true,
    maxLength: 500,
  },
  {
    id: "free-text",
    type: "text",
    prompt: "Andre kommentarer?",
    required: false,
    maxLength: 500,
  },
];

const optionalMainQuestionSurvey: FlexJarQuestion[] = [
  {
    id: "rating",
    type: "rating",
    prompt: "Hvor fornøyd er du?",
    required: true,
    scale: 5,
  },
  {
    id: "feedback",
    type: "text",
    prompt: "Hva kan vi forbedre?",
    required: false,
    maxLength: 500,
  },
];

const FEEDBACK_ID = "test-feedback";

const INITIAL_TIME = new Date("2024-01-01T12:00:00.000Z");
const SUBMIT_TIME = new Date("2024-01-01T12:05:00.000Z");
const RESET_TIME = new Date("2024-01-01T12:07:00.000Z");
const POST_RESET_SUBMIT_TIME = new Date("2024-01-01T12:09:00.000Z");

function createEventSpies(): FlexJarEvents {
  return {
    onAnswer: vi.fn(),
    onValidationFailed: vi.fn(),
    onSubmitStart: vi.fn(),
    onSubmitSuccess: vi.fn(),
    onSubmitError: vi.fn(),
    onReset: vi.fn(),
  };
}

describe("useFlexJar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(INITIAL_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns validation error when required answers are missing", async () => {
    const submitMock = vi.fn(async (payload: FlexJarSubmission) => {
      void payload;
    });
    const transport: FlexJarTransport = {
      submit: submitMock,
    };

    const { result } = renderHook(() =>
      useFlexJar({
        feedbackId: FEEDBACK_ID,
        questions: requiredQuestions,
        transport,
        coreQuestionIds: {
          rating: "rating",
          main: "feedback",
        },
      }),
    );

    let submission: FlexJarSubmitResult | undefined;
    await act(async () => {
      submission = await result.current.submit();
    });
    expect(submission).toBeDefined();
    if (!submission) {
      throw new Error("Submission result expected");
    }

    expect(submission.ok).toBe(false);
    if (!submission.ok) {
      expect(submission.error.type).toBe("validation");
      if (submission.error.type === "validation") {
        expect(submission.error.missing).toEqual(["rating", "feedback"]);
      }
    }

    expect(submitMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("error");
  });

  it("allows submissions when the main question is optional", async () => {
    const submitMock = vi.fn(async (payload: FlexJarSubmission) => {
      void payload;
    });
    const transport: FlexJarTransport = {
      submit: submitMock,
    };

    const { result } = renderHook(() =>
      useFlexJar({
        feedbackId: FEEDBACK_ID,
        questions: optionalMainQuestionSurvey,
        transport,
        coreQuestionIds: {
          rating: "rating",
          main: "feedback",
        },
      }),
    );

    await act(() => {
      result.current.setAnswer("rating", 5);
    });

    let submission: FlexJarSubmitResult | undefined;
    await act(async () => {
      submission = await result.current.submit();
    });

    expect(submission).toBeDefined();
    if (!submission) {
      throw new Error("Submission result expected");
    }

    expect(submission.ok).toBe(true);
    if (!submission.ok) {
      throw new Error("Expected submission to succeed");
    }

    expect(submitMock).toHaveBeenCalledTimes(1);
    const payload = submitMock.mock.calls[0][0];

    expect(payload.answers).toEqual({ rating: 5 });
    expect(payload.transportPayload.surveyId).toBe(FEEDBACK_ID);
    expect(payload.transportPayload.answers).toHaveLength(1);
    expect(payload.transportPayload.answers[0].fieldType).toBe("RATING");

    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
  });

  it("submits answers when validation passes", async () => {
    const submitMock = vi.fn(async (payload: FlexJarSubmission) => {
      void payload;
    });
    const transport: FlexJarTransport = {
      submit: submitMock,
    };

    const { result } = renderHook(() =>
      useFlexJar({
        feedbackId: FEEDBACK_ID,
        questions: requiredQuestions,
        transport,
        coreQuestionIds: {
          rating: "rating",
          main: "feedback",
        },
      }),
    );

    await act(() => {
      result.current.setAnswer("rating", 4);
      result.current.setAnswer("feedback", "Alt fungerer fint");
      result.current.setAnswer("free-text", "Alt fungerer fint");
    });

    vi.setSystemTime(SUBMIT_TIME);

    let submission: FlexJarSubmitResult | undefined;
    await act(async () => {
      submission = await result.current.submit();
    });

    expect(submitMock).toHaveBeenCalledTimes(1);
    const payload = submitMock.mock.calls[0][0];

    expect(payload.feedbackId).toBe(FEEDBACK_ID);
    expect(payload.answers).toEqual({
      rating: 4,
      feedback: "Alt fungerer fint",
      "free-text": "Alt fungerer fint",
    });
    expect(payload.transportPayload.feedbackId).toBe(FEEDBACK_ID);
    expect(payload.transportPayload.surveyId).toBe(FEEDBACK_ID);
    expect(payload.transportPayload.answers).toHaveLength(3);
    
    // Verify structured answers
    const ratingAnswer = payload.transportPayload.answers.find(
      (a: { fieldType: string }) => a.fieldType === "RATING"
    );
    expect(ratingAnswer).toBeDefined();
    expect(ratingAnswer.value).toEqual({ type: "rating", rating: 4 });
    expect(ratingAnswer.question.label).toBe("Hvor fornøyd er du?");

    const feedbackAnswer = payload.transportPayload.answers.find(
      (a: { fieldId: string }) => a.fieldId === "feedback"
    );
    expect(feedbackAnswer).toBeDefined();
    expect(feedbackAnswer.value).toEqual({ type: "text", text: "Alt fungerer fint" });

    expect(payload.startedAt).toBe(INITIAL_TIME.toISOString());
    expect(payload.submittedAt).toBe(SUBMIT_TIME.toISOString());

    expect(submission).toBeDefined();
    if (!submission) {
      throw new Error("Submission result expected");
    }

    expect(submission.ok).toBe(true);
    if (submission.ok) {
      expect(submission.submission).toEqual(payload);
    }

    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
  });

  it("surfaces transport failures and triggers error callbacks", async () => {
    const transportError = new Error("Transport failed");
    const transport: FlexJarTransport = {
      submit: vi.fn().mockRejectedValue(transportError),
    };
    const events = createEventSpies();

    const { result } = renderHook(() =>
      useFlexJar({
        feedbackId: FEEDBACK_ID,
        questions: requiredQuestions,
        transport,
        events,
        coreQuestionIds: {
          rating: "rating",
          main: "feedback",
        },
      }),
    );

    await act(() => {
      result.current.setAnswer("rating", 3);
      result.current.setAnswer("feedback", "Hei");
    });

    vi.setSystemTime(SUBMIT_TIME);

    let submission: FlexJarSubmitResult | undefined;
    await act(async () => {
      submission = await result.current.submit();
    });

    expect(submission).toBeDefined();
    if (!submission) {
      throw new Error("Submission expected");
    }

    expect(submission.ok).toBe(false);
    if (!submission.ok) {
      expect(submission.error.type).toBe("transport");
      if (submission.error.type === "transport") {
        expect(submission.error.cause).toBe(transportError);
      }
    }

    expect(result.current.status).toBe("error");
    expect(result.current.error?.type).toBe("transport");

    expect(transport.submit).toHaveBeenCalledTimes(1);
    expect(events.onSubmitStart).toHaveBeenCalledTimes(1);
    expect(events.onSubmitError).toHaveBeenCalledWith(transportError);
    expect(events.onSubmitSuccess).not.toHaveBeenCalled();
    expect(events.onValidationFailed).not.toHaveBeenCalled();
    expect(events.onAnswer).toHaveBeenCalledWith("rating", 3);
    expect(events.onAnswer).toHaveBeenCalledWith("feedback", "Hei");
  });

  it("resets answers to the initial snapshot and refreshes startedAt", async () => {
    const submitMock = vi.fn(async (payload: FlexJarSubmission) => {
      void payload;
    });
    const transport: FlexJarTransport = {
      submit: submitMock,
    };
    const events = createEventSpies();

    const initialAnswers: Record<string, FlexJarAnswerValue> = {
      rating: 2,
      feedback: "Initial",
    };

    const { result } = renderHook(() =>
      useFlexJar({
        feedbackId: FEEDBACK_ID,
        questions: requiredQuestions,
        transport,
        events,
        initialAnswers,
        coreQuestionIds: {
          rating: "rating",
          main: "feedback",
        },
      }),
    );

    expect(result.current.answers).toEqual({ rating: 2, feedback: "Initial" });

    await act(() => {
      result.current.setAnswer("rating", 5);
      result.current.setAnswer("feedback", "Updated");
      result.current.setAnswer("free-text", "Notes");
    });

    vi.setSystemTime(RESET_TIME);

    await act(() => {
      result.current.reset();
    });

    expect(result.current.answers).toEqual({ rating: 2, feedback: "Initial" });
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(events.onReset).toHaveBeenCalledTimes(1);

    vi.setSystemTime(POST_RESET_SUBMIT_TIME);

    await act(() => {
      result.current.setAnswer("rating", 4);
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(submitMock).toHaveBeenCalledTimes(1);
    const call = submitMock.mock.calls[0][0];
    expect(call.startedAt).toBe(RESET_TIME.toISOString());
    expect(call.submittedAt).toBe(POST_RESET_SUBMIT_TIME.toISOString());
    expect(call.answers.rating).toBe(4);
    expect(call.answers.feedback).toBe("Initial");
  });

  it("drops empty answer values instead of storing blanks", () => {
    const transport: FlexJarTransport = {
      submit: vi.fn(),
    };

    const { result } = renderHook(() =>
      useFlexJar({
        feedbackId: FEEDBACK_ID,
        questions: requiredQuestions,
        transport,
        coreQuestionIds: {
          rating: "rating",
          main: "feedback",
        },
      }),
    );

    act(() => {
      result.current.setAnswer("feedback", "some text");
    });
    expect(result.current.answers.feedback).toBe("some text");

    act(() => {
      result.current.setAnswer("feedback", "   ");
    });

    expect(result.current.answers).not.toHaveProperty("feedback");
  });
});
