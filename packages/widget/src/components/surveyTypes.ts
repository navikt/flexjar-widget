import type { FlexJarQuestion, SurveyType } from "../core/types.js";

export { type SurveyType };

/**
 * Configuration for a Flexjar survey.
 * Questions are displayed in array order.
 */
export interface FlexJarSurveyConfig {
  /**
   * Survey type for analytics categorization.
   * Determines how the dashboard displays and aggregates results.
   * @default "custom"
   */
  type?: SurveyType;

  /**
   * All questions to display, in order.
   * The first question is rendered prominently in the dock header.
   */
  questions: FlexJarQuestion[];

  /**
   * Optional ID of a question that must be answered before showing remaining questions.
   * If not set, all questions are shown at once.
   * Typically set to the first question's ID to create a progressive disclosure UX.
   */
  gateQuestionId?: string;
}


