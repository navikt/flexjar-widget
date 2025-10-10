import { useMemo } from "react";
import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
} from "@navikt/flexjar-core";

export interface RatingGateResult {
  ratingQuestion?: Extract<FlexJarQuestion, { type: "rating" }>;
  ratingAnswer: FlexJarAnswerValue | undefined;
  isRatingAnswered: boolean;
  shouldDeferQuestion: (question: FlexJarQuestion) => boolean;
  isSubmitBlocked: boolean;
}

const isRatingQuestion = (
  question: FlexJarQuestion,
): question is Extract<FlexJarQuestion, { type: "rating" }> =>
  question.type === "rating";

export const useRatingGate = (
  questions: FlexJarQuestion[],
  answers: Record<string, FlexJarAnswerValue | undefined>,
): RatingGateResult => {
  const ratingQuestion = useMemo(() => {
    return questions.find(isRatingQuestion);
  }, [questions]);

  const ratingAnswer = ratingQuestion
    ? answers[ratingQuestion.id]
    : undefined;

  const isRatingAnswered = ratingQuestion
    ? ratingAnswer !== undefined && ratingAnswer !== null
    : true;

  const shouldDeferQuestion = useMemo(() => {
    if (!ratingQuestion) {
      return () => false;
    }

    return (question: FlexJarQuestion): boolean =>
      question.id !== ratingQuestion.id && !isRatingAnswered;
  }, [isRatingAnswered, ratingQuestion]);

  const isSubmitBlocked = Boolean(ratingQuestion) && !isRatingAnswered;

  return {
    ratingQuestion,
    ratingAnswer,
    isRatingAnswered,
    shouldDeferQuestion,
    isSubmitBlocked,
  };
};
