import type { FlexJarQuestion, RatingQuestion } from "../../core/types.js";
import type {
  FlexJarFollowUpQuestion,
  FlexJarSurveyConfig,
} from "../surveyTypes.js";

const RESERVED_KEYS = new Set<string>();

export const RATING_ANSWER_KEY = "svar";
export const MAIN_ANSWER_KEY = "feedback";

RESERVED_KEYS.add(RATING_ANSWER_KEY);
RESERVED_KEYS.add(MAIN_ANSWER_KEY);

type AllowedMainQuestion = Extract<
  FlexJarQuestion,
  { type: "text" | "singleChoice" }
>;

export interface CanonicalSurvey {
  ratingQuestion: RatingQuestion;
  mainQuestion: AllowedMainQuestion;
  followUpQuestions: FlexJarFollowUpQuestion[];
  coreQuestionIds: {
    rating: string;
    main: string;
  };
}

export const buildCanonicalSurvey = (
  survey: FlexJarSurveyConfig,
): CanonicalSurvey => {
  const { rating, mainQuestion, followUpQuestions } = survey;

  const ratingQuestion: RatingQuestion = {
    ...rating,
    id: RATING_ANSWER_KEY,
    analyticsId: rating.analyticsId ?? rating.id ?? RATING_ANSWER_KEY,
    required: true,
  };

  const mainBase = {
    ...mainQuestion,
    id: MAIN_ANSWER_KEY,
    analyticsId: mainQuestion.analyticsId ?? mainQuestion.id ?? MAIN_ANSWER_KEY,
    required: true,
  } as FlexJarQuestion;

  if (mainBase.type !== "text" && mainBase.type !== "singleChoice") {
    throw new Error(
      `FlexJar mainQuestion must be of type "text" or "singleChoice", received "${mainBase.type}".`,
    );
  }

  const canonicalMain: AllowedMainQuestion = mainBase;

  const sanitizedFollowUps: FlexJarFollowUpQuestion[] = (followUpQuestions ?? []).filter(
    (question) => !RESERVED_KEYS.has(question.id),
  );

  return {
    ratingQuestion,
    mainQuestion: canonicalMain,
    followUpQuestions: sanitizedFollowUps,
    coreQuestionIds: {
      rating: ratingQuestion.id,
      main: canonicalMain.id,
    },
  };
};
