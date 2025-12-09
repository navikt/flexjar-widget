import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRatingGate } from "../useRatingGate.js";
import type { RatingQuestion } from "../../../../core/types.js";

const ratingQuestion: RatingQuestion = {
  id: "rating",
  type: "rating",
  prompt: "Hvor fornøyd er du?",
  required: true,
  scale: 5,
};

describe("useRatingGate", () => {
  it("returns isRatingAnswered=false when rating is undefined", () => {
    const { result } = renderHook(() =>
      useRatingGate(ratingQuestion, { rating: undefined }),
    );

    expect(result.current.isRatingAnswered).toBe(false);
    expect(result.current.isSubmitBlocked).toBe(true);
  });

  it("returns isRatingAnswered=true when rating has a value", () => {
    const { result } = renderHook(() =>
      useRatingGate(ratingQuestion, { rating: 5 }),
    );

    expect(result.current.isRatingAnswered).toBe(true);
    expect(result.current.isSubmitBlocked).toBe(false);
  });

  it("shouldDeferQuestion returns true for non-rating questions when rating not answered", () => {
    const { result } = renderHook(() =>
      useRatingGate(ratingQuestion, { rating: undefined }),
    );

    expect(
      result.current.shouldDeferQuestion({ id: "feedback", type: "text", prompt: "Test", required: true }),
    ).toBe(true);
    expect(
      result.current.shouldDeferQuestion({ id: "rating", type: "rating", prompt: "Test", required: true, scale: 5 }),
    ).toBe(false);
  });

  it("shouldDeferQuestion returns false for all questions when rating is answered", () => {
    const { result } = renderHook(() =>
      useRatingGate(ratingQuestion, { rating: 4 }),
    );

    expect(
      result.current.shouldDeferQuestion({ id: "feedback", type: "text", prompt: "Test", required: true }),
    ).toBe(false);
    expect(
      result.current.shouldDeferQuestion({ id: "rating", type: "rating", prompt: "Test", required: true, scale: 5 }),
    ).toBe(false);
  });

  it("handles null rating as unanswered", () => {
    const { result } = renderHook(() =>
      useRatingGate(ratingQuestion, { rating: null as unknown as undefined }),
    );

    expect(result.current.isRatingAnswered).toBe(false);
    expect(result.current.isSubmitBlocked).toBe(true);
  });

  it("handles rating value of 0 as answered", () => {
    // Edge case: 0 is falsy but should be treated as an answer
    const { result } = renderHook(() =>
      useRatingGate(ratingQuestion, { rating: 0 }),
    );

    // Note: 0 is a valid rating value
    expect(result.current.isRatingAnswered).toBe(true);
    expect(result.current.isSubmitBlocked).toBe(false);
  });
});
