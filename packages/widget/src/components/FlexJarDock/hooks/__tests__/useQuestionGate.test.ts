import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuestionGate } from "../useQuestionGate.js";
import type { FlexJarQuestion } from "../../../../core/types.js";

const questions: FlexJarQuestion[] = [
  { id: "gate", type: "rating", prompt: "Gate question", required: true },
  { id: "other", type: "text", prompt: "Other question", required: true },
];

describe("useQuestionGate", () => {
  it("isGateAnswered=false and blocked submit when gate is unanswered", () => {
    const { result } = renderHook(() =>
      useQuestionGate(questions, { gate: undefined }, "gate")
    );

    expect(result.current.isGateAnswered).toBe(false);
    expect(result.current.isSubmitBlocked).toBe(true);
    expect(result.current.gateQuestion).toBeDefined();
  });

  it("isGateAnswered=true and allowed submit when gate is answered", () => {
    const { result } = renderHook(() =>
      useQuestionGate(questions, { gate: 5 }, "gate")
    );

    expect(result.current.isGateAnswered).toBe(true);
    expect(result.current.isSubmitBlocked).toBe(false);
  });

  it("defers other questions when gate is unanswered", () => {
    const { result } = renderHook(() =>
      useQuestionGate(questions, { gate: undefined }, "gate")
    );

    expect(result.current.shouldDeferQuestion(questions[1])).toBe(true);
    expect(result.current.shouldDeferQuestion(questions[0])).toBe(false); // Never defer gate itself
  });

  it("does not defer when gate is answered", () => {
    const { result } = renderHook(() =>
      useQuestionGate(questions, { gate: 5 }, "gate")
    );

    expect(result.current.shouldDeferQuestion(questions[1])).toBe(false);
  });

  it("handles empty/missing gateQuestionId (no gate)", () => {
    const { result } = renderHook(() =>
      useQuestionGate(questions, {}, undefined)
    );

    expect(result.current.isGateAnswered).toBe(true);
    expect(result.current.isSubmitBlocked).toBe(false);
    expect(result.current.gateQuestion).toBeUndefined();
    expect(result.current.shouldDeferQuestion(questions[1])).toBe(false);
  });

  it("handles null answer as unanswered", () => {
    const { result } = renderHook(() =>
      useQuestionGate(questions, { gate: null as unknown as undefined }, "gate")
    );

    expect(result.current.isGateAnswered).toBe(false);
  });

  it("handles 0 as answered", () => {
    const { result } = renderHook(() =>
      useQuestionGate(questions, { gate: 0 }, "gate")
    );

    expect(result.current.isGateAnswered).toBe(true);
  });
});
