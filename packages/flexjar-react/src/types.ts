import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
} from "@navikt/flexjar-core";

export interface FlexJarRenderQuestionProps {
  question: FlexJarQuestion;
  value: FlexJarAnswerValue | undefined;
  onChange: (nextValue: FlexJarAnswerValue | null | undefined) => void;
  isMissing: boolean;
  disabled: boolean;
}

export interface FlexJarDefaultQuestionProps extends FlexJarRenderQuestionProps {
  validationErrorMessage: string;
}
