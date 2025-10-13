import React, { useCallback, useMemo, useRef } from "react";
import { BodyShort, Box, Heading, HStack, VStack } from "@navikt/ds-react";
import type {
  FlexJarAnswerValue,
  RatingQuestion,
} from "../../../core/types.js";
import { EmojiButton } from "./EmojiButton.js";
import { Glad, Lei, Noytral, Sinna, VeldigGlad } from "./emojies.js";
import styles from "./emo.module.css";
import "./emo.fallback.css";

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

const CLASS_NAMES = {
  row: styles.emojiRow ?? "flexjar-rating__row",
  fieldset: styles.fieldset ?? "flexjar-rating__fieldset",
  legend: styles.legend ?? "flexjar-rating__legend",
  button: styles.emobutton ?? "flexjar-rating__emoji-button",
  active: styles.active ?? "flexjar-rating__emoji-button--active",
  error: styles.errorMessage ?? "flexjar-rating__error-message",
  variants: {
    sinna: styles.sinnaButton ?? "flexjar-rating__emoji-button--sinna",
    lei: styles.leiButton ?? "flexjar-rating__emoji-button--lei",
    noytral: styles.noytralButton ?? "flexjar-rating__emoji-button--noytral",
    glad: styles.gladButton ?? "flexjar-rating__emoji-button--glad",
    veldigGlad:
      styles.veldigGladButton ?? "flexjar-rating__emoji-button--veldig-glad",
  },
} as const;

const VARIANTS: EmojiVariant[] = [
  {
    className: CLASS_NAMES.variants.sinna,
    activeFill: "var(--a-red-100)",
    activeColor: "var(--a-red-500)",
    fallbackLabel: "Veldig dårlig",
    Icon: Sinna,
  },
  {
    className: CLASS_NAMES.variants.lei,
    activeFill: "var(--a-orange-100)",
    activeColor: "var(--a-orange-500)",
    fallbackLabel: "Dårlig",
    Icon: Lei,
  },
  {
    className: CLASS_NAMES.variants.noytral,
    activeFill: "var(--a-blue-100)",
    activeColor: "var(--a-blue-500)",
    fallbackLabel: "Nøytral",
    Icon: Noytral,
  },
  {
    className: CLASS_NAMES.variants.glad,
    activeFill: "var(--a-green-100)",
    activeColor: "var(--a-green-400)",
    fallbackLabel: "Bra",
    Icon: Glad,
  },
  {
    className: CLASS_NAMES.variants.veldigGlad,
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
      <Box
        as="fieldset"
        className={CLASS_NAMES.fieldset}
        aria-labelledby={headingId}
        aria-describedby={describedBy}
        paddingBlock="3"
        paddingInline="4"
      >
        <legend className={CLASS_NAMES.legend}>{question.prompt}</legend>
        <HStack
          gap="4"
          justify="start"
          align="center"
          wrap
          className={CLASS_NAMES.row}
          role="radiogroup"
          aria-labelledby={headingId}
          aria-describedby={describedBy}
        >
          {options.map((option, index) => {
            const variant = resolveVariant(index);
            const labelText = resolveLabel(question, option);
            const isActive = activeState === option;
            const buttonClass = joinClassNames(
              CLASS_NAMES.button,
              variant.className,
              isActive ? CLASS_NAMES.active : undefined,
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
      </Box>
      {isMissing && (
        <BodyShort id={errorId} className={CLASS_NAMES.error} role="alert">
          {validationErrorMessage}
        </BodyShort>
      )}
    </VStack>
  );
};
