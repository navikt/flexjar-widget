import { useMemo } from "react";
import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
  RatingQuestion,
} from "../../../core/types.js";

export interface RatingGateResult {
  ratingQuestion: RatingQuestion;
  ratingAnswer: FlexJarAnswerValue | undefined;
  isRatingAnswered: boolean;
  shouldDeferQuestion: (question: FlexJarQuestion) => boolean;
  isSubmitBlocked: boolean;
}

export const useRatingGate = (
  ratingQuestion: RatingQuestion,
  answers: Record<string, FlexJarAnswerValue | undefined>,
): RatingGateResult => {
  const ratingAnswer = answers[ratingQuestion.id];

  const isRatingAnswered = ratingAnswer !== undefined && ratingAnswer !== null;

  const shouldDeferQuestion = useMemo(
    () =>
      (question: FlexJarQuestion): boolean =>
        question.id !== ratingQuestion.id && !isRatingAnswered,
    [isRatingAnswered, ratingQuestion.id],
  );

  const isSubmitBlocked = !isRatingAnswered;

  return {
    ratingQuestion,
    ratingAnswer,
    isRatingAnswered,
    shouldDeferQuestion,
    isSubmitBlocked,
  };
};
