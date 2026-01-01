export type FlexJarQuestionType = "rating" | "text" | "singleChoice" | "multiChoice";

// ============================================
// Branching Logic Types (Skip Logic)
// ============================================

/**
 * Field type for logic conditions.
 * - "ANSWER": Compare against the current question's answer
 * - "METADATA": Compare against a value in the survey metadata
 */
export type LogicField = "ANSWER" | "METADATA";

/**
 * Comparison operators for logic conditions.
 */
export type LogicOperator = "EQ" | "NEQ" | "GT" | "LT" | "CONTAINS";

/**
 * A condition that determines whether a logic rule should trigger.
 * Uses discriminated unions for type safety.
 */
export type LogicCondition =
  | {
      /** Compare against the current question's answer */
      field: "ANSWER";
      /** Comparison operator */
      operator: LogicOperator;
      /** Value to compare against */
      value: string | number | boolean;
    }
  | {
      /** Compare against a value in the survey metadata */
      field: "METADATA";
      /** Key to look up in metadata (required for METADATA) */
      key: string;
      /** Comparison operator */
      operator: LogicOperator;
      /** Value to compare against */
      value: string | number | boolean;
    };

/**
 * Action type for logic rules.
 * - "JUMP_TO": Jump to a specific question by ID
 * - "SKIP": Skip the next question (go to currentIndex + 2)
 * - "SUBMIT": Submit the survey immediately
 */
export type LogicActionType = "JUMP_TO" | "SKIP" | "SUBMIT";

/**
 * Action to perform when a logic condition is met.
 * Uses discriminated unions to ensure targetId is provided for JUMP_TO.
 */
export type LogicAction =
  | {
      /** Jump to a specific question */
      type: "JUMP_TO";
      /** Target question ID (required for JUMP_TO) */
      targetId: string;
    }
  | {
      /** Skip the next question */
      type: "SKIP";
    }
  | {
      /** Submit the survey immediately */
      type: "SUBMIT";
    };

/**
 * A branching rule that controls survey navigation.
 * Rules are evaluated in order; first matching rule wins.
 */
export interface LogicRule {
  /** Condition to evaluate */
  condition: LogicCondition;
  /** Action to perform if condition is met */
  action: LogicAction;
}

// ============================================
// Question Base Type
// ============================================

export interface FlexJarQuestionBase<TType extends FlexJarQuestionType> {
  id: string;
  type: TType;
  prompt: string;
  description?: string;
  required?: boolean;
  analyticsId?: string;
  /**
   * Optional branching rules evaluated after this question is answered.
   * Rules are evaluated in order; first matching rule determines navigation.
   * If no rules match (or logic is undefined), proceeds to next question.
   */
  logic?: LogicRule[];
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

export interface ChoiceQuestion extends FlexJarQuestionBase<
  "singleChoice" | "multiChoice"
> {
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
 * - "discovery": Free-text task discovery to identify what users are trying to do
 * - "taskPriority": Users select their top 5 most important tasks from a list
 * - "custom": Any other question combination
 */
export type SurveyType =
  | "rating"
  | "topTasks"
  | "discovery"
  | "taskPriority"
  | "custom";

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
