export type FlexJarQuestionType =
  | "rating"
  | "text"
  | "singleChoice"
  | "multiChoice";

export interface FlexJarQuestionBase<TType extends FlexJarQuestionType> {
  id: string;
  type: TType;
  prompt: string;
  description?: string;
  required?: boolean;
  analyticsId?: string;
}

export interface RatingScaleLabel {
  value: number;
  label: string;
}

export interface RatingQuestion extends FlexJarQuestionBase<"rating"> {
  scale?: number;
  labels?: RatingScaleLabel[];
}

export interface TextQuestion extends FlexJarQuestionBase<"text"> {
  maxLength?: number;
  minRows?: number;
  placeholder?: string;
  autoComplete?: string;
}

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface ChoiceQuestion
  extends FlexJarQuestionBase<"singleChoice" | "multiChoice"> {
  options: ChoiceOption[];
  randomize?: boolean;
}

export type FlexJarQuestion =
  | RatingQuestion
  | TextQuestion
  | (ChoiceQuestion & { type: "singleChoice" })
  | (ChoiceQuestion & { type: "multiChoice" });

export type FlexJarAnswerValue = string | number | string[];

/**
 * Survey type identifier for analytics and dashboard display.
 * - "rating": Classic 1-5 scale with optional text (current default behavior)
 * - "topTasks": Task selection + success measurement for conversion tracking
 * - "custom": Any other question combination
 */
export type SurveyType = "rating" | "topTasks" | "custom";

export type FlexJarTransportPayload = {
  feedbackId: string;
  surveyType?: SurveyType;
  svar?: number;
  feedback?: string;
  /** Custom metadata for segmentation/filtering (e.g. { harDialogmote: true }) */
  metadata?: Record<string, unknown>;
} & Record<string, FlexJarAnswerValue | string>;

export interface FlexJarSubmission {
  feedbackId: string;
  answers: Record<string, FlexJarAnswerValue>;
  startedAt: string;
  submittedAt: string;
  context?: Record<string, unknown>;
  transportPayload: FlexJarTransportPayload;
}

export interface FlexJarTransport {
  submit: (submission: FlexJarSubmission) => Promise<void>;
}

export interface FlexJarEvents {
  onViewDock?: (feedbackId: string) => void;
  onAnswer?: (questionId: string, value: unknown) => void;
  onSubmitStart?: (submission: FlexJarSubmission) => void;
  onSubmitSuccess?: (submission: FlexJarSubmission) => void;
  onSubmitError?: (cause: unknown) => void;
  onValidationFailed?: (missingQuestionIds: string[]) => void;
  onReset?: () => void;
  /**
   * Fired when the dock cannot persist its dismissal flag due to storage restrictions (for example when consent is denied).
   */
  onDismissalPersistFailed?: (cause: unknown) => void;
}

export type FlexJarStatus = "idle" | "submitting" | "success" | "error";

export interface FlexJarValidationError {
  type: "validation";
  missing: string[];
}

export interface FlexJarTransportError {
  type: "transport";
  cause: unknown;
}

export type FlexJarError = FlexJarValidationError | FlexJarTransportError;

export interface FlexJarSubmitSuccess {
  ok: true;
  submission: FlexJarSubmission;
}

export interface FlexJarSubmitFailure {
  ok: false;
  error: FlexJarError;
}

export type FlexJarSubmitResult = FlexJarSubmitSuccess | FlexJarSubmitFailure;
