import type { FlexJarQuestion } from "../../core/types.js";
import type { FlexJarSurveyConfig, SurveyType } from "../surveyTypes.js";

export const RATING_ANSWER_KEY = "svar";
export const MAIN_ANSWER_KEY = "feedback";

export interface CanonicalSurvey {
  type: SurveyType;
  questions: FlexJarQuestion[];
  gateQuestionId: string | undefined;
}

export function buildCanonicalSurvey(survey: FlexJarSurveyConfig): CanonicalSurvey {
  if (!survey.questions || survey.questions.length === 0) {
    throw new Error("FlexJar survey must have at least one question");
  }

  // Validate all questions have IDs
  for (const question of survey.questions) {
    if (!question.id) {
      throw new Error("FlexJar: All questions must have an id");
    }
  }

  // Validate that gateQuestionId exists in questions if provided
  if (survey.gateQuestionId) {
    const gateExists = survey.questions.some(q => q.id === survey.gateQuestionId);
    if (!gateExists) {
      throw new Error(
        `FlexJar gateQuestionId "${survey.gateQuestionId}" does not match any question ID`
      );
    }
  }



  return {
    type: survey.type ?? "custom",
    questions: survey.questions,
    gateQuestionId: survey.gateQuestionId,
  };
}
