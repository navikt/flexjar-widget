import React, { useCallback, useState } from "react";
import { BodyShort, Box, Heading, HStack, VStack } from "@navikt/ds-react";
import { ThumbUpIcon, ThumbDownIcon } from "@navikt/aksel-icons";
import type { ThumbsRatingQuestion, FlexJarAnswerValue } from "../../../core/types.js";
import styles from "./emo.module.css";
import "./emo.fallback.css";

interface ThumbsRatingProps {
    question: ThumbsRatingQuestion;
    value: FlexJarAnswerValue | undefined;
    onChange: (value: number | null) => void;
    validationErrorMessage: string;
    isMissing: boolean;
    disabled: boolean;
    className?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    hidePrompt?: boolean;
    hideDescription?: boolean;
}

/**
 * 2-point thumbs rating: 👎 👍
 * Modern inline style inspired by ChatGPT/Claude feedback.
 * Clean, minimal, with subtle hover effects.
 */
export function ThumbsRating({
    question,
    value,
    onChange,
    validationErrorMessage,
    isMissing,
    disabled,
    className,
    ariaLabelledBy,
    ariaDescribedBy,
    hidePrompt = false,
    hideDescription = false,
}: ThumbsRatingProps) {
    const [hoveredValue, setHoveredValue] = useState<number | null>(null);
    const activeState = typeof value === "number" ? value : null;
    const fallbackHeadingId = `${question.id}-heading`;
    const fallbackDescriptionId = `${question.id}-description`;
    const errorId = `${question.id}-error`;

    const handleSelect = useCallback(
        (nextValue: number) => {
            if (!disabled) {
                onChange(nextValue);
            }
        },
        [disabled, onChange],
    );

    const getButtonStyles = (thumbValue: number, isActive: boolean, isHovered: boolean) => {
        const isDown = thumbValue === 1;

        // Base styles
        const base: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--ax-space-6)",
            padding: "var(--ax-space-8) var(--ax-space-16)",
            border: "1.5px solid",
            borderRadius: "var(--ax-radius-full)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            fontSize: "0.875rem",
            fontWeight: 500,
            outline: "none",
        };

        if (isActive) {
            // Selected state
            return {
                ...base,
                background: isDown
                    ? "var(--ax-bg-danger-soft)"
                    : "var(--ax-bg-success-soft)",
                borderColor: isDown
                    ? "var(--ax-border-danger)"
                    : "var(--ax-border-success)",
                color: isDown
                    ? "var(--ax-text-danger)"
                    : "var(--ax-text-success)",
                transform: "scale(1.02)",
            };
        }

        if (isHovered) {
            // Hover state
            return {
                ...base,
                background: isDown
                    ? "rgba(239, 68, 68, 0.08)"
                    : "rgba(34, 197, 94, 0.08)",
                borderColor: isDown
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(34, 197, 94, 0.3)",
                color: isDown
                    ? "var(--ax-text-danger)"
                    : "var(--ax-text-success)",
                transform: "scale(1.02)",
            };
        }

        // Default state
        return {
            ...base,
            background: "transparent",
            borderColor: "var(--ax-border-neutral-subtle)",
            color: "var(--ax-text-neutral)",
        };
    };

    return (
        <VStack gap="space-8" className={className}>
            {!hidePrompt && (
                <Heading
                    id={ariaLabelledBy ? undefined : fallbackHeadingId}
                    level="3"
                    size="xsmall"
                >
                    {question.prompt}
                </Heading>
            )}
            {question.description && !hideDescription && (
                <BodyShort id={ariaDescribedBy ? undefined : fallbackDescriptionId}>
                    {question.description}
                </BodyShort>
            )}
            <Box.New
                as="fieldset"
                className={styles.fieldset ?? "flexjar-rating__fieldset"}
                aria-labelledby={ariaLabelledBy ?? (!hidePrompt ? fallbackHeadingId : undefined)}
                aria-describedby={
                    ariaDescribedBy ??
                    (!hideDescription && question.description ? fallbackDescriptionId : undefined)
                }
                paddingBlock="space-12"
                paddingInline="space-16"
            >
                <legend className={styles.legend ?? "flexjar-rating__legend"}>
                    {question.prompt}
                </legend>
                <HStack gap="space-12" justify="center" align="center" role="radiogroup">
                    {/* Thumbs Down */}
                    <button
                        type="button"
                        role="radio"
                        aria-checked={activeState === 1}
                        aria-label="Tommel ned"
                        onClick={() => handleSelect(1)}
                        onMouseEnter={() => !disabled && setHoveredValue(1)}
                        onMouseLeave={() => setHoveredValue(null)}
                        onFocus={() => !disabled && setHoveredValue(1)}
                        onBlur={() => setHoveredValue(null)}
                        disabled={disabled}
                        tabIndex={activeState === 1 || !activeState ? 0 : -1}
                        style={getButtonStyles(1, activeState === 1, hoveredValue === 1)}
                    >
                        <ThumbDownIcon fontSize="1.25rem" aria-hidden />
                        <span>Nei</span>
                    </button>

                    {/* Thumbs Up */}
                    <button
                        type="button"
                        role="radio"
                        aria-checked={activeState === 2}
                        aria-label="Tommel opp"
                        onClick={() => handleSelect(2)}
                        onMouseEnter={() => !disabled && setHoveredValue(2)}
                        onMouseLeave={() => setHoveredValue(null)}
                        onFocus={() => !disabled && setHoveredValue(2)}
                        onBlur={() => setHoveredValue(null)}
                        disabled={disabled}
                        tabIndex={activeState === 2 ? 0 : -1}
                        style={getButtonStyles(2, activeState === 2, hoveredValue === 2)}
                    >
                        <ThumbUpIcon fontSize="1.25rem" aria-hidden />
                        <span>Ja</span>
                    </button>
                </HStack>
            </Box.New>
            {isMissing && (
                <BodyShort
                    id={errorId}
                    className={styles.errorMessage ?? "flexjar-rating__error-message"}
                    role="alert"
                >
                    {validationErrorMessage}
                </BodyShort>
            )}
        </VStack>
    );
}

