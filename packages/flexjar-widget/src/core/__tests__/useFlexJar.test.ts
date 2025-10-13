import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useFlexJar } from "../useFlexJar.js";
import type {
  FlexJarQuestion,
  FlexJarTransport,
  FlexJarSubmission,
  FlexJarSubmitResult,
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

const FEEDBACK_ID = "test-feedback";

const INITIAL_TIME = new Date("2024-01-01T12:00:00.000Z");
const SUBMIT_TIME = new Date("2024-01-01T12:05:00.000Z");

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
    expect(payload.transportPayload.svar).toBe(4);
    expect(payload.transportPayload.feedback).toBe("Alt fungerer fint");
    expect(payload.transportPayload.rating).toBe(4);
    expect(payload.transportPayload["free-text"]).toBe("Alt fungerer fint");
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
});
