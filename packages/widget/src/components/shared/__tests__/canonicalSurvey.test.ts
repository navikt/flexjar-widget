import { describe, expect, it } from "vitest";
import {
  buildCanonicalSurvey,
  MAIN_ANSWER_KEY,
  RATING_ANSWER_KEY,
} from "../canonicalSurvey.js";
import type { FlexJarSurveyConfig } from "../../surveyTypes.js";

const baseSurvey: FlexJarSurveyConfig = {
  rating: {
    type: "rating",
    prompt: "Hvordan var opplevelsen?",
    id: "custom-rating",
    analyticsId: "rating-analytics",
  },
  mainQuestion: {
    type: "text",
    prompt: "Hva kan vi forbedre?",
    id: "custom-feedback",
  },
  followUpQuestions: [
    {
      id: "freetext",
      type: "text",
      prompt: "Andre kommentarer?",
    },
    {
      id: "svar",
      type: "singleChoice",
      prompt: "Denne skal filtreres bort",
      options: [{ value: "ignored", label: "Ignored" }],
    },
  ],
};

describe("buildCanonicalSurvey", () => {
  it("normalises rating and main question IDs to canonical keys", () => {
    const survey = buildCanonicalSurvey(baseSurvey);

    expect(survey.ratingQuestion.id).toBe(RATING_ANSWER_KEY);
    expect(survey.mainQuestion.id).toBe(MAIN_ANSWER_KEY);
    expect(survey.coreQuestionIds).toEqual({
      rating: RATING_ANSWER_KEY,
      main: MAIN_ANSWER_KEY,
    });
  });

  it("keeps analyticsId overrides while falling back to provided ids", () => {
    const survey = buildCanonicalSurvey({
      ...baseSurvey,
      rating: {
        type: "rating",
        prompt: "Hvordan var opplevelsen?",
      },
      mainQuestion: {
        type: "text",
        prompt: "Hva kan vi forbedre?",
        analyticsId: "main-analytics",
      },
    });

    expect(survey.ratingQuestion.analyticsId).toBe(RATING_ANSWER_KEY);
    expect(survey.mainQuestion.analyticsId).toBe("main-analytics");
  });

  it("accepts a singleChoice main question and preserves options", () => {
    const survey = buildCanonicalSurvey({
      ...baseSurvey,
      mainQuestion: {
        type: "singleChoice",
        prompt: "Opplever du at oppfølgingsplanen er nyttig?",
        options: [
          { value: "yes", label: "Ja" },
          { value: "no", label: "Nei" },
        ],
      },
      followUpQuestions: [],
    });

    expect(survey.mainQuestion.type).toBe("singleChoice");
    if (survey.mainQuestion.type === "singleChoice") {
      expect(survey.mainQuestion.options).toHaveLength(2);
    }
    expect(survey.mainQuestion.id).toBe(MAIN_ANSWER_KEY);
  });

  it("throws when main question type is unsupported", () => {
    expect(() =>
      buildCanonicalSurvey({
        ...baseSurvey,
        mainQuestion: {
          type: "multiChoice",
          prompt: "Invalid",
          options: [],
        } as never,
      }),
    ).toThrowError(
      'FlexJar mainQuestion must be of type "text" or "singleChoice", received "multiChoice".',
    );
  });

  it("filters follow-up questions that collide with reserved keys", () => {
    const survey = buildCanonicalSurvey(baseSurvey);
    expect(survey.followUpQuestions.map((question) => question.id)).toEqual([
      "freetext",
    ]);
  });
});
