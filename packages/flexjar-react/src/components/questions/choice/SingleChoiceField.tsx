import React from "react";
import { Radio, RadioGroup } from "@navikt/ds-react";
import type {
  ChoiceOption,
  ChoiceQuestion,
  FlexJarAnswerValue,
} from "@navikt/flexjar-core";
import { useChoiceOptions } from "./useChoiceOptions.js";

interface SingleChoiceFieldProps {
  question: ChoiceQuestion & { type: "singleChoice" };
  value: FlexJarAnswerValue | undefined;
  onChange: (value: string | null) => void;
  validationErrorMessage: string;
  isMissing: boolean;
  disabled: boolean;
}

export const SingleChoiceField = ({
  question,
  value,
  onChange,
  validationErrorMessage,
  isMissing,
  disabled,
}: SingleChoiceFieldProps) => {
  const options = useChoiceOptions(question);
  const selected = typeof value === "string" ? value : "";

  return (
    <RadioGroup
      legend={question.prompt}
      description={question.description}
      value={selected}
      onChange={(nextValue: string) => onChange(nextValue ?? null)}
      disabled={disabled}
      error={isMissing ? validationErrorMessage : undefined}
    >
      {options.map((option: ChoiceOption) => (
        <Radio key={option.value} value={option.value} description={option.description}>
          {option.label}
        </Radio>
      ))}
    </RadioGroup>
  );
};
