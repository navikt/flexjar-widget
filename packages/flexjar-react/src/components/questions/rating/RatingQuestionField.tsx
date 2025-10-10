import React, { useCallback, useMemo, useRef } from "react";
import { BodyShort, Heading, HStack, VStack } from "@navikt/ds-react";
import type { FlexJarAnswerValue, RatingQuestion } from "@navikt/flexjar-core";
import { EmojiButton } from "./EmojiButton.js";
import { Glad, Lei, Noytral, Sinna, VeldigGlad } from "./emojies.js";
import styles from "./emo.module.css";

interface RatingQuestionFieldProps {
  question: RatingQuestion;
  value: FlexJarAnswerValue | undefined;
  onChange: (value: number | null) => void;
  validationErrorMessage: string;
  isMissing: boolean;
  disabled: boolean;
}

interface EmojiVariant {
  className: string;
  activeFill: string;
  activeColor: string;
  fallbackLabel: string;
  Icon: (props: { fill?: string }) => JSX.Element;
}

const VARIANTS: EmojiVariant[] = [
  {
    className: styles.sinnaButton,
    activeFill: "var(--a-red-100)",
    activeColor: "var(--a-red-500)",
    fallbackLabel: "Veldig dårlig",
    Icon: Sinna,
  },
  {
    className: styles.leiButton,
    activeFill: "var(--a-orange-100)",
    activeColor: "var(--a-orange-500)",
    fallbackLabel: "Dårlig",
    Icon: Lei,
  },
  {
    className: styles.noytralButton,
    activeFill: "var(--a-blue-100)",
    activeColor: "var(--a-blue-500)",
    fallbackLabel: "Nøytral",
    Icon: Noytral,
  },
  {
    className: styles.gladButton,
    activeFill: "var(--a-green-100)",
    activeColor: "var(--a-green-400)",
    fallbackLabel: "Bra",
    Icon: Glad,
  },
  {
    className: styles.veldigGladButton,
    activeFill: "var(--a-green-200)",
    activeColor: "var(--a-green-700)",
    fallbackLabel: "Veldig bra",
    Icon: VeldigGlad,
  },
];

const joinClassNames = (
  ...classNames: Array<string | false | undefined>
): string => classNames.filter(Boolean).join(" ");

const resolveVariant = (index: number): EmojiVariant =>
  VARIANTS[Math.min(index, VARIANTS.length - 1)];

const resolveLabel = (question: RatingQuestion, value: number): string => {
  const override = question.labels?.find((label) => label.value === value);
  if (override) {
    return override.label;
  }

  const variant = resolveVariant(value - 1);
  return variant.fallbackLabel ?? String(value);
};

export const RatingQuestionField = ({
  question,
  value,
  onChange,
  validationErrorMessage,
  isMissing,
  disabled,
}: RatingQuestionFieldProps) => {
  const scale = question.scale ?? 5;
  const options = Array.from({ length: scale }, (_, index) => index + 1);
  const activeState = typeof value === "number" ? value : null;
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  buttonRefs.current.length = options.length;

  const headingId = `${question.id}-heading`;
  const descriptionId = question.description
    ? `${question.id}-description`
    : undefined;
  const errorId = `${question.id}-error`;
  const describedBy = useMemo(() => {
    const references = [descriptionId, isMissing ? errorId : undefined].filter(
      Boolean,
    );
    return references.length > 0 ? references.join(" ") : undefined;
  }, [descriptionId, errorId, isMissing]);

  const handleSelect = useCallback(
    (nextValue: number) => {
      if (!disabled) {
        onChange(nextValue);
      }
    },
    [disabled, onChange],
  );

  const focusByIndex = useCallback(
    (index: number): number | undefined => {
      if (options.length === 0) {
        return undefined;
      }

      const normalized = ((index % options.length) + options.length) % options.length;
      const target = buttonRefs.current[normalized];
      target?.focus();
      return normalized;
    },
    [options.length],
  );

  const handleKeyNavigation = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      if (disabled) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          {
            const nextIndex = focusByIndex(currentIndex + 1);
            if (nextIndex !== undefined) {
              handleSelect(options[nextIndex]);
            }
          }
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          {
            const nextIndex = focusByIndex(currentIndex - 1);
            if (nextIndex !== undefined) {
              handleSelect(options[nextIndex]);
            }
          }
          break;
        case "Home":
          event.preventDefault();
          {
            const nextIndex = focusByIndex(0);
            if (nextIndex !== undefined) {
              handleSelect(options[nextIndex]);
            }
          }
          break;
        case "End":
          event.preventDefault();
          {
            const nextIndex = focusByIndex(options.length - 1);
            if (nextIndex !== undefined) {
              handleSelect(options[nextIndex]);
            }
          }
          break;
        case "Enter":
        case " ":
        case "Spacebar":
          event.preventDefault();
          handleSelect(options[currentIndex]);
          break;
        default:
          break;
      }
    },
    [disabled, focusByIndex, handleSelect, options],
  );

  return (
    <VStack gap="2">
      <Heading id={headingId} level="3" size="small">
        {question.prompt}
      </Heading>
      {question.description && (
        <BodyShort id={descriptionId}>{question.description}</BodyShort>
      )}
      <fieldset
        className={styles.fieldset}
        aria-labelledby={headingId}
        aria-describedby={describedBy}
      >
        <legend className={styles.legend}>{question.prompt}</legend>
        <HStack
          gap="4"
          justify="start"
          className={styles.emojiRow}
          role="radiogroup"
          aria-labelledby={headingId}
          aria-describedby={describedBy}
        >
          {options.map((option, index) => {
            const variant = resolveVariant(index);
            const labelText = resolveLabel(question, option);
            const isActive = activeState === option;
            const buttonClass = joinClassNames(
              styles.emobutton,
              variant.className,
              isActive ? styles.active : undefined,
            );
            const buttonStyle = isActive
              ? { color: variant.activeColor }
              : undefined;
            const Icon = variant.Icon;
            const ariaLabel = `${option}. ${labelText}`;

            return (
              <EmojiButton
                key={option}
                feedback={option}
                activeState={activeState}
                setActiveState={handleSelect}
                className={buttonClass}
                style={buttonStyle}
                text={labelText}
                ariaLabel={ariaLabel}
                disabled={disabled}
                onKeyDown={(event) => handleKeyNavigation(event, index)}
                ref={(element) => {
                  buttonRefs.current[index] = element;
                }}
              >
                <Icon fill={isActive ? variant.activeFill : undefined} />
              </EmojiButton>
            );
          })}
        </HStack>
      </fieldset>
      {(question.minimumLabel || question.maximumLabel) && (
        <div className={styles.range}>
          <BodyShort>{question.minimumLabel}</BodyShort>
          <BodyShort>{question.maximumLabel}</BodyShort>
        </div>
      )}
      {isMissing && (
        <BodyShort id={errorId} className={styles.errorMessage} role="alert">
          {validationErrorMessage}
        </BodyShort>
      )}
    </VStack>
  );
};
