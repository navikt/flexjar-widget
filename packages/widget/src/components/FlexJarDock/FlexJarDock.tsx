import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BodyShort,
  Box,
  type BoxProps,
  Button,
  HStack,
  Heading,
  VStack,
} from "@navikt/ds-react";
import { XMarkIcon } from "@navikt/aksel-icons";
import { useFlexJar } from "../../core/useFlexJar.js";
import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
  RatingQuestion,
} from "../../core/types.js";
import { DefaultQuestionRenderer } from "../questions/index.js";
import { RatingQuestionField } from "../questions/rating/index.js";
import { useRatingGate } from "../FlexJarModal/useRatingGate.js";
import { SuccessContent } from "../FlexJarModal/SuccessContent.js";
import { useAutoCloseOnSuccess } from "../FlexJarModal/useAutoCloseOnSuccess.js";
import type { FlexJarRenderQuestionProps } from "../../types.js";
import { buildCanonicalSurvey } from "../shared/canonicalSurvey.js";
import {
  DEFAULT_COPY,
  DEFAULT_PERSONAL_DATA_NOTICE,
} from "../FlexJar/commonDefaults.js";
import type { FlexJarModalProps } from "../FlexJarModal/FlexJarModal.js";
import styles from "./FlexJarDock.module.css";
import "./FlexJarDock.fallback.css";

export interface FlexJarDockProps
  extends Omit<
    FlexJarModalProps,
    "open" | "onClose" | "width" | "className"
  > {
  /**
   * Controls which side of the viewport the dock sticks to.
   * @default "bottom-right"
   */
  position?: "bottom-right" | "bottom-left";
  /**
   * Offset (in px) from the viewport edge.
   * @default 24
   */
  offset?: number;
  /** Optional class for the outer floating container. */
  containerClassName?: string;
  /** Optional class for the inner panel. */
  panelClassName?: string;
  /**
   * Background token applied to the dock panel. Defaults to a subtle surface tone to lift the panel from white pages.
   * @default "surface-subtle"
   */
  panelBackground?: BoxProps["background"];
  /**
   * Border token applied to the dock panel. Set to `undefined` to remove the border.
   * @default "border-subtle"
   */
  panelBorderColor?: BoxProps["borderColor"];
}

const CLASS_NAMES = {
  container: styles.container ?? "flexjar-dock",
  panel: styles.panel ?? "flexjar-dock__panel",
  header: styles.header ?? "flexjar-dock__header",
  headerText: styles.headerText ?? "flexjar-dock__header-text",
  closeButton: styles.closeButton ?? "flexjar-dock__close-button",
  ratingSection: styles.ratingSection ?? "flexjar-dock__rating",
  ratingHeading: styles.ratingHeading ?? "flexjar-dock__rating-heading",
  ratingDescription: styles.ratingDescription ?? "flexjar-dock__rating-description",
  ratingField: styles.ratingField ?? "flexjar-dock__rating-field",
  ratingFieldset: styles.ratingFieldset ?? "flexjar-dock__rating-fieldset",
  ratingRow: styles.ratingRow ?? "flexjar-dock__rating-row",
  ratingButton: styles.ratingButton ?? "flexjar-dock__rating-button",
};

const joinClassNames = (...classNames: Array<string | false | undefined>) =>
  classNames.filter(Boolean).join(" ");

export const FlexJarDock = ({
  feedbackId,
  survey,
  transport,
  events,
  context,
  title = "Gi tilbakemelding",
  intro: _intro,
  submitLabel = DEFAULT_COPY.submitLabel,
  submitPendingLabel = DEFAULT_COPY.submitPendingLabel,
  cancelLabel = DEFAULT_COPY.cancelLabel,
  validationErrorMessage = DEFAULT_COPY.validationErrorMessage,
  transportErrorMessage = DEFAULT_COPY.transportErrorMessage,
  successTitle = DEFAULT_COPY.successTitle,
  successBody = DEFAULT_COPY.successBody,
  successPrimaryLabel = DEFAULT_COPY.successPrimaryLabel,
  renderQuestion,
  resetOnClose = true,
  autoCloseOnSuccess = false,
  successCloseDelayMs = 1600,
  showPersonalDataNotice = true,
  personalDataNotice,
  position = "bottom-right",
  offset = 24,
  containerClassName,
  panelClassName,
  panelBackground = "surface-default",
  panelBorderColor = "border-subtle",
}: FlexJarDockProps) => {
  void _intro;

  const storageKey = useMemo(
    () => `flexjar-dock-dismissed:${feedbackId}`,
    [feedbackId],
  );

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      return window.sessionStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  const canonicalSurvey = useMemo(() => buildCanonicalSurvey(survey), [survey]);
  const { ratingQuestion, mainQuestion, followUpQuestions, coreQuestionIds } =
    canonicalSurvey;

  const orderedQuestions = useMemo(
    () => [ratingQuestion, mainQuestion, ...followUpQuestions],
    [followUpQuestions, mainQuestion, ratingQuestion],
  );

  const ratingHeadingId = `${ratingQuestion.id}-dock-heading`;
  const ratingDescriptionId = ratingQuestion.description
    ? `${ratingQuestion.id}-dock-description`
    : undefined;
  const successHeadingId = `${feedbackId}-dock-success-heading`;

  const { answers, status, error, setAnswer, submit, reset } = useFlexJar({
    feedbackId,
    questions: orderedQuestions,
    transport,
    events,
    context,
    coreQuestionIds,
  });

  useEffect(() => {
    if (!dismissed) {
      events?.onViewModal?.(feedbackId);
    }
  }, [dismissed, events, feedbackId]);

  const persistDismissed = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch (persistError) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console -- development-time diagnostics only
        console.warn(
          "FlexJar: failed to persist dock dismissal in sessionStorage. The dock may reappear if the page reloads.",
          persistError,
        );
      }
      events?.onDismissalPersistFailed?.(persistError);
    }
  }, [events, storageKey]);

  const handleClose = useCallback(() => {
    if (dismissed) {
      return;
    }
    if (resetOnClose) {
      reset();
    }
    setDismissed(true);
    persistDismissed();
  }, [dismissed, persistDismissed, reset, resetOnClose]);

  useAutoCloseOnSuccess({
    enabled: autoCloseOnSuccess,
    status,
    delayMs: successCloseDelayMs,
    onClose: handleClose,
  });

  const { shouldDeferQuestion, isSubmitBlocked } = useRatingGate(
    ratingQuestion,
    answers,
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submit();
    },
    [submit],
  );

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";
  const validationMissing = error?.type === "validation" ? error.missing : [];

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: offset,
    right: position === "bottom-right" ? offset : undefined,
    left: position === "bottom-left" ? offset : undefined,
    zIndex: 1000,
    width: `min(24rem, calc(100vw - ${offset * 2}px))`,
  };

  const panelStyle: React.CSSProperties = {
    maxHeight: "calc(100vh - 2rem)",
    overflowY: "auto",
  };

  const defaultQuestionRenderer = useCallback(
    (props: FlexJarRenderQuestionProps) => {
      if (props.question.type === "rating") {
        const rating = props.question as RatingQuestion;
        return (
          <div className={CLASS_NAMES.ratingSection}>
            <div className={CLASS_NAMES.ratingField}>
              <RatingQuestionField
                question={rating}
                value={props.value}
                onChange={props.onChange}
                validationErrorMessage={validationErrorMessage}
                isMissing={props.isMissing}
                disabled={props.disabled}
                fieldsetClassName={CLASS_NAMES.ratingFieldset}
                hidePrompt
                hideDescription
                hideValueLabels
                wrap={false}
                ariaLabelledBy={ratingHeadingId}
                ariaDescribedBy={ratingDescriptionId}
                rowClassName={CLASS_NAMES.ratingRow}
                buttonClassName={CLASS_NAMES.ratingButton}
                fieldsetPaddingBlock="2"
                fieldsetPaddingInline="0"
              />
            </div>
          </div>
        );
      }

      return (
        <DefaultQuestionRenderer
          question={props.question}
          value={props.value}
          onChange={props.onChange}
          isMissing={props.isMissing}
          disabled={props.disabled}
          validationErrorMessage={validationErrorMessage}
        />
      );
    },
    [ratingDescriptionId, ratingHeadingId, validationErrorMessage],
  );

  const questionRenderer = renderQuestion ?? defaultQuestionRenderer;

  const panelAriaLabel = title;

  if (dismissed) {
    return null;
  }

  return (
    <div
      className={joinClassNames(CLASS_NAMES.container, containerClassName)}
      style={containerStyle}
      data-feedback-id={feedbackId}
    >
      <Box
        padding="4"
        background={panelBackground}
        borderRadius="large"
        shadow="large"
        borderWidth={panelBorderColor ? "1" : undefined}
        borderColor={panelBorderColor}
        className={joinClassNames(CLASS_NAMES.panel, panelClassName)}
        style={panelStyle}
        aria-label={panelAriaLabel}
      >
          <div className={CLASS_NAMES.header}>
            <div
              className={CLASS_NAMES.headerText}
              role={isSuccess ? "status" : undefined}
              aria-live={isSuccess ? "polite" : undefined}
            >
              {isSuccess ? (
                <Heading
                  level="2"
                  size="medium"
                  className={CLASS_NAMES.ratingHeading}
                  id={successHeadingId}
                >
                  {successTitle}
                </Heading>
              ) : (
                <>
                  <Heading
                    level="2"
                    size="medium"
                    className={CLASS_NAMES.ratingHeading}
                    id={ratingHeadingId}
                  >
                    {ratingQuestion.prompt}
                  </Heading>
                  {ratingQuestion.description && (
                    <BodyShort
                      size="small"
                      className={CLASS_NAMES.ratingDescription}
                      id={ratingDescriptionId}
                    >
                      {ratingQuestion.description}
                    </BodyShort>
                  )}
                </>
              )}
            </div>
            <Button
              variant="tertiary"
              size="small"
              onClick={handleClose}
              icon={<XMarkIcon aria-hidden />}
              aria-label={cancelLabel}
              className={CLASS_NAMES.closeButton}
              type="button"
            />
          </div>
          {isSuccess ? (
            <VStack gap="4">
              <SuccessContent
                title={successTitle}
                body={successBody}
                showTitle={false}
                announce={Boolean(successBody)}
              />
              <Button onClick={handleClose}>{successPrimaryLabel}</Button>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <VStack gap="4">
                {orderedQuestions.map((question: FlexJarQuestion) => {
                  if (shouldDeferQuestion(question)) {
                    return null;
                  }

                  const value = answers[question.id];
                  const isMissing = validationMissing.includes(question.id);
                  const onChange = (
                    nextValue: FlexJarAnswerValue | null | undefined,
                  ) => {
                    setAnswer(question.id, nextValue);
                  };

                  return (
                    <div key={question.id} className="flexjar-question">
                      {questionRenderer({
                        question,
                        value,
                        onChange,
                        isMissing,
                        disabled: isSubmitting,
                      })}
                    </div>
                  );
                })}

                {error?.type === "transport" && (
                  <Alert variant="error" role="alert">
                    {transportErrorMessage}
                  </Alert>
                )}

                {showPersonalDataNotice && !isSubmitBlocked && (
                  <Alert variant="warning" role="alert">
                    {personalDataNotice ?? DEFAULT_PERSONAL_DATA_NOTICE}
                  </Alert>
                )}

                <HStack gap="2" wrap>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting || isSubmitBlocked}
                  >
                    {isSubmitting ? submitPendingLabel : submitLabel}
                  </Button>
                  <Button variant="tertiary" type="button" onClick={handleClose}>
                    {cancelLabel}
                  </Button>
                </HStack>
              </VStack>
            </form>
          )}
      </Box>
    </div>
  );
};

FlexJarDock.displayName = "FlexJarDock";
