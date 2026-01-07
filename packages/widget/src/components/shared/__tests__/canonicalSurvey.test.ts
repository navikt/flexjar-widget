import { describe, expect, it } from "vitest";
import {
  buildCanonicalSurvey,
} from "../canonicalSurvey.js";
import type { FlexJarSurveyConfig } from "../../surveyTypes.js";

const validQuestions = [
  { id: "q1", type: "rating", prompt: "Rating" },
  { id: "q2", type: "text", prompt: "Text" },
] as const;

describe("buildCanonicalSurvey", () => {
  it("passes through questions as-is", () => {
    const survey: FlexJarSurveyConfig = {
      questions: [...validQuestions],
    };

    const canonical = buildCanonicalSurvey(survey);
    expect(canonical.questions).toEqual(validQuestions);
    expect(canonical.type).toBe("custom");
  });

  it("sets survey type if provided", () => {
    const canonical = buildCanonicalSurvey({
      type: "rating",
      questions: [...validQuestions],
    });
    expect(canonical.type).toBe("rating");
  });

  it("validates that all questions have IDs", () => {
    const invalidQuestions = [
      { type: "text", prompt: "No ID" },
    ] as unknown as FlexJarSurveyConfig["questions"];

    expect(() =>
      buildCanonicalSurvey({ questions: invalidQuestions })
    ).toThrowError("FlexJar: All questions must have an id");
  });

  it("validates that gateQuestionId exists", () => {
    expect(() =>
      buildCanonicalSurvey({
        questions: [...validQuestions],
        gateQuestionId: "non-existent",
      })
    ).toThrowError('FlexJar gateQuestionId "non-existent" does not match any question ID');
  });

  it("accepts valid gateQuestionId", () => {
    const canonical = buildCanonicalSurvey({
      questions: [...validQuestions],
      gateQuestionId: "q1",
    });
    expect(canonical.gateQuestionId).toBe("q1");
  });



  it("throws if questions array is empty", () => {
    expect(() =>
      buildCanonicalSurvey({ questions: [] })
    ).toThrowError("FlexJar survey must have at least one question");
  });
});
