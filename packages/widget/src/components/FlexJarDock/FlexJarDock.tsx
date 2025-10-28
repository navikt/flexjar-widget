import React, { useCallback, useMemo, type ReactNode } from "react";
import type { BoxProps } from "@navikt/ds-react";
import { useFlexJar } from "../../core";
import type {
  FlexJarEvents,
  FlexJarTransport,
  RatingQuestion,
} from "../../core";
import {
  DefaultQuestionRenderer,
  RatingQuestionField,
} from "../questions";
import { useRatingGate } from "./hooks/useRatingGate.js";
import { useAutoCloseOnSuccess } from "./hooks/useAutoCloseOnSuccess.js";
import type { FlexJarRenderQuestionProps } from "../../types.js";
import { buildCanonicalSurvey } from "../shared/canonicalSurvey.js";
import {
  DEFAULT_COPY,
  DEFAULT_PERSONAL_DATA_NOTICE,
} from "../shared/commonDefaults.js";
import type { FlexJarSurveyConfig } from "../surveyTypes.js";
import { DockPanel } from "./components/DockPanel.js";
import { MinimizedDock } from "./components/MinimizedDock.js";
import { CLASS_NAMES, joinClassNames } from "./classNames.js";
import { usePersistedDismissal } from "./hooks/usePersistedDismissal.js";
import "./FlexJarDock.fallback.css";

export interface FlexJarDockProps {
  feedbackId: string;
  survey: FlexJarSurveyConfig;
  transport: FlexJarTransport;
  events?: FlexJarEvents;
  context?: Record<string, unknown>;
  title?: string;
  submitLabel?: string;
  submitPendingLabel?: string;
  cancelLabel?: string;
  validationErrorMessage?: string;
  transportErrorMessage?: string;
  successTitle?: string;
  successBody?: ReactNode;
  successPrimaryLabel?: string;
  renderQuestion?: (props: FlexJarRenderQuestionProps) => ReactNode;
  resetOnClose?: boolean;
  autoCloseOnSuccess?: boolean;
  successCloseDelayMs?: number;
  showPersonalDataNotice?: boolean;
  personalDataNotice?: ReactNode;
  position?: "bottom-right" | "bottom-left";
  offset?: number;
  containerClassName?: string;
  panelClassName?: string;
  panelBackground?: BoxProps["background"];
  panelBorderColor?: BoxProps["borderColor"];
  initialOpen?: boolean;
  minimizedButtonLabel?: string;
  dismissCooldownDays?: number;
}

export const FlexJarDock = ({
  feedbackId,
  survey,
  transport,
  events,
  context,
  title = "Gi tilbakemelding",
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
  initialOpen = true,
  minimizedButtonLabel,
  dismissCooldownDays = 30,
}: FlexJarDockProps) => {
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
  const panelId = `${feedbackId}-dock-panel`;

  const { answers, status, error, setAnswer, submit, reset } = useFlexJar({
    feedbackId,
    questions: orderedQuestions,
    transport,
    events,
    context,
    coreQuestionIds,
  });

  const { dismissed, closeDock, reopenDock } = usePersistedDismissal({
    feedbackId,
    initialOpen,
    dismissCooldownDays,
    events,
    resetOnClose,
    onReset: reset,
  });

  useAutoCloseOnSuccess({
    enabled: autoCloseOnSuccess,
    status,
    delayMs: successCloseDelayMs,
    onClose: closeDock,
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
  const hasTransportError = error?.type === "transport";

  const baseContainerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: offset,
    right: position === "bottom-right" ? offset : undefined,
    left: position === "bottom-left" ? offset : undefined,
    zIndex: 1000,
  };

  const containerStyle: React.CSSProperties = dismissed
    ? baseContainerStyle
    : {
        ...baseContainerStyle,
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
  const reopenLabel = minimizedButtonLabel ?? title;
  const noticeContent = personalDataNotice ?? DEFAULT_PERSONAL_DATA_NOTICE;

  return (
    <div
      className={joinClassNames(CLASS_NAMES.container, containerClassName)}
      style={containerStyle}
      data-feedback-id={feedbackId}
      data-state={dismissed ? "dismissed" : "open"}
    >
      {dismissed ? (
        <MinimizedDock
          label={reopenLabel}
          panelId={panelId}
          onReopen={reopenDock}
          className={CLASS_NAMES.minimizedButton}
        />
      ) : (
        <DockPanel
          panelId={panelId}
          panelLabel={title}
          panelClassName={panelClassName}
          panelStyle={panelStyle}
          panelBackground={panelBackground}
          panelBorderColor={panelBorderColor}
          ratingQuestion={ratingQuestion}
          ratingHeadingId={ratingHeadingId}
          ratingDescriptionId={ratingDescriptionId}
          successHeadingId={successHeadingId}
          successTitle={successTitle}
          successBody={successBody}
          successPrimaryLabel={successPrimaryLabel}
          isSuccess={isSuccess}
          onClose={closeDock}
          onSubmit={handleSubmit}
          orderedQuestions={orderedQuestions}
          answers={answers}
          renderQuestion={questionRenderer}
          validationMissing={validationMissing}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          submitPendingLabel={submitPendingLabel}
          cancelLabel={cancelLabel}
          showPersonalDataNotice={showPersonalDataNotice}
          personalDataNotice={noticeContent}
          isSubmitBlocked={isSubmitBlocked}
          hasTransportError={Boolean(hasTransportError)}
          transportErrorMessage={transportErrorMessage}
          shouldDeferQuestion={shouldDeferQuestion}
          onQuestionChange={setAnswer}
        />
      )}
    </div>
  );
};

FlexJarDock.displayName = "FlexJarDock";
