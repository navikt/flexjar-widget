import type { FlexJarQuestion, RatingQuestion } from "../core/types.js";

export type FlexJarFollowUpQuestion = Exclude<FlexJarQuestion, { type: "rating" }>;

type TextMainQuestion = Extract<FlexJarQuestion, { type: "text" }>;
type SingleChoiceMainQuestion = Extract<FlexJarQuestion, { type: "singleChoice" }>;

export type FlexJarMainQuestion =
  | (Omit<TextMainQuestion, "id"> & { id?: string })
  | (Omit<SingleChoiceMainQuestion, "id"> & { id?: string });
export type FlexJarRatingQuestion = Omit<RatingQuestion, "id"> & { id?: string };

export interface FlexJarSurveyConfig {
  rating: FlexJarRatingQuestion;
  mainQuestion: FlexJarMainQuestion;
  followUpQuestions?: FlexJarFollowUpQuestion[];
}
