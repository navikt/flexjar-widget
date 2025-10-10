import React from "react";
import { Checkbox, CheckboxGroup } from "@navikt/ds-react";
import type {
  ChoiceOption,
  ChoiceQuestion,
  FlexJarAnswerValue,
} from "@navikt/flexjar-core";
import { useChoiceOptions } from "./useChoiceOptions.js";

interface MultiChoiceFieldProps {
  question: ChoiceQuestion & { type: "multiChoice" };
  value: FlexJarAnswerValue | undefined;
  onChange: (value: string[]) => void;
  validationErrorMessage: string;
  isMissing: boolean;
  disabled: boolean;
}

export const MultiChoiceField = ({
  question,
  value,
  onChange,
  validationErrorMessage,
  isMissing,
  disabled,
}: MultiChoiceFieldProps) => {
  const options = useChoiceOptions(question);
  const selected = Array.isArray(value) ? value : [];

  return (
    <CheckboxGroup
      legend={question.prompt}
      description={question.description}
      value={selected}
      onChange={(nextValues: string[]) => onChange(nextValues)}
      disabled={disabled}
      error={isMissing ? validationErrorMessage : undefined}
    >
      {options.map((option: ChoiceOption) => (
        <Checkbox key={option.value} value={option.value} description={option.description}>
          {option.label}
        </Checkbox>
      ))}
    </CheckboxGroup>
  );
};
