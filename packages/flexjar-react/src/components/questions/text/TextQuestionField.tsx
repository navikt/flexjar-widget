import React from "react";
import { Textarea } from "@navikt/ds-react";
import type { FlexJarAnswerValue, TextQuestion } from "@navikt/flexjar-core";

interface TextQuestionFieldProps {
  question: TextQuestion;
  value: FlexJarAnswerValue | undefined;
  onChange: (value: string) => void;
  validationErrorMessage: string;
  isMissing: boolean;
  disabled: boolean;
}

export const TextQuestionField = ({
  question,
  value,
  onChange,
  validationErrorMessage,
  isMissing,
  disabled,
}: TextQuestionFieldProps) => (
  <Textarea
    label={question.prompt}
    description={question.description}
    value={typeof value === "string" ? value : ""}
    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChange(event.target.value)
    }
  maxLength={question.maxLength ?? 1000}
    minRows={question.minRows}
    placeholder={question.placeholder}
    autoComplete={question.autoComplete}
    disabled={disabled}
    error={isMissing ? validationErrorMessage : undefined}
  />
);
