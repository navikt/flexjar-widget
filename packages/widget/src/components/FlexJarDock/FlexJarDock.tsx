import React, { type ReactNode, useCallback, useMemo } from "react";
import type { BoxNewProps } from "@navikt/ds-react/Box";
import type { FlexJarEvents, FlexJarTransport, RatingQuestion } from "../../core";
import { useFlexJar } from "../../core";
import { DefaultQuestionRenderer, RatingQuestionField } from "../questions";
import { useQuestionGate } from "./hooks/useQuestionGate.js";
import { useAutoCloseOnSuccess } from "./hooks/useAutoCloseOnSuccess.js";
import { useStepNavigation } from "./hooks/useStepNavigation.js";
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

import type {
  FlexJarLabels,
  FlexJarSuccessConfig,
  FlexJarStyle,
  FlexJarBehavior,
} from "./propTypes.js";

/**
 * Props for the FlexJarDock component.
 * 
 * @example
 * ```tsx
 * <FlexJarDock
 *   feedbackId="my-app"
 *   survey={NAV_STANDARD_RATING}
 *   transport={transport}
 *   labels={{ submit: "Send", cancel: "Avbryt" }}
 *   success={{ title: "Takk!", autoClose: true }}
 *   behavior={{ storageStrategy: "localStorage" }}
 * />
 * ```
 */
export interface FlexJarDockProps {
  /**
   * Unique identifier for this feedback instance. Used for localStorage persistence keys and event tracking.
   * @example "oppfolgingsplan-feedback"
   */
  feedbackId: string;

  /**
   * Survey configuration defining the questions to display.
   * Use presets like NAV_STANDARD_RATING or create custom with createRatingSurvey().
   */
  survey: FlexJarSurveyConfig;

  /**
   * Transport implementation for submitting feedback data.
   * Receives the formatted submission payload and returns a promise.
   */
  transport: FlexJarTransport;

  /**
   * Labels for UI elements (submit button, error messages, etc.).
   */
  labels?: FlexJarLabels;

  /**
   * Success state configuration (title, body, auto-close).
   */
  success?: FlexJarSuccessConfig;

  /**
   * Visual styling options (position, colors, classNames).
   */
  style?: FlexJarStyle;

  /**
   * Behavior options (persistence, cooldown, privacy notice).
   */
  behavior?: FlexJarBehavior;

  /**
   * Optional event callbacks for tracking user interactions and lifecycle events.
   */
  events?: FlexJarEvents;

  /**
   * Additional context data to include with submissions.
   */
  context?: Record<string, unknown>;

  /**
   * Custom metadata for segmentation/filtering in analytics.
   */
  metadata?: Record<string, unknown>;
}

export const FlexJarDock = ({
  feedbackId,
  survey,
  transport,
  events,
  context,
  metadata,
  labels,
  success,
  style,
  behavior,
}: FlexJarDockProps) => {
  // Resolve props from grouped config with defaults
  const submitLabel = labels?.submit ?? DEFAULT_COPY.submitLabel;
  const submitPendingLabel = labels?.submitPending ?? DEFAULT_COPY.submitPendingLabel;
  const cancelLabel = labels?.cancel ?? DEFAULT_COPY.cancelLabel;
  const validationErrorMessage = labels?.validationError ?? DEFAULT_COPY.validationErrorMessage;
  const transportErrorMessage = labels?.transportError ?? DEFAULT_COPY.transportErrorMessage;
  const minimizedButtonLabel = labels?.minimizedButton ?? "Gi tilbakemelding";

  const successTitle = success?.title ?? DEFAULT_COPY.successTitle;
  const successBody = success?.body ?? DEFAULT_COPY.successBody;
  const successPrimaryLabel = success?.primaryLabel ?? DEFAULT_COPY.successPrimaryLabel;
  const autoCloseOnSuccess = success?.autoClose ?? false;
  const successCloseDelayMs = success?.autoCloseDelayMs ?? 1600;

  const position = style?.position ?? "bottom-right";
  const offset = style?.offset ?? 24;
  const containerClassName = style?.containerClassName;
  const panelClassName = style?.panelClassName;
  const panelBackground = style?.panelBackground ?? "default";
  const panelBorderColor = style?.panelBorderColor ?? "neutral-subtle";

  const initialOpen = behavior?.initialOpen ?? true;
  const resetOnClose = behavior?.resetOnClose ?? true;
  const dismissCooldownDays = behavior?.dismissCooldownDays ?? 30;
  const hideAfterSubmit = behavior?.hideAfterSubmit ?? true;
  const showPersonalDataNotice = behavior?.showPersonalDataNotice ?? true;
  const personalDataNotice = behavior?.personalDataNotice;
  const storageStrategy = behavior?.storageStrategy ?? "consent";

  // IMPORTANT: Call all hooks before any conditional returns to comply with Rules of Hooks

  /* 
   * Use the new flexible survey builder.
   * "questions" is the full list of questions in display order.
   * "gateQuestionId" defines which question acts as the visibility gate.
   */
  const canonicalSurvey = useMemo(() => buildCanonicalSurvey(survey), [survey]);
  const { type: surveyType, questions, gateQuestionId } = canonicalSurvey;

  // The first question is used as the "prompt" question in the header
  const promptQuestion = questions[0];

  const promptHeadingId = `${promptQuestion.id}-dock-heading`;
  const promptDescriptionId = promptQuestion.description
    ? `${promptQuestion.id}-dock-description`
    : undefined;
  const successHeadingId = `${feedbackId}-dock-success-heading`;
  const panelId = `${feedbackId}-dock-panel`;

  const { answers, status, error, setAnswer, submit, reset } = useFlexJar({
    feedbackId,
    questions,
    transport,
    events,
    context,
    metadata,
    surveyType,
  });

  const { dismissed, shouldHideCompletely, isLoading, closeDock, reopenDock } =
    usePersistedDismissal({
      feedbackId,
      initialOpen,
      dismissCooldownDays,
      events,
      resetOnClose,
      onReset: reset,
      storageStrategy,
    });

  const { shouldDeferQuestion, isSubmitBlocked } = useQuestionGate(
    questions,
    answers,
    gateQuestionId,
  );

  // Step navigation for branching logic
  const {
    isStepMode,
    currentStep,
    currentQuestion: currentStepQuestion,
    canGoBack,
    canGoNext,
    isLastStep,
    shouldSubmit,
    goToNext,
    goToPrevious,
  } = useStepNavigation({
    questions,
    answers,
    metadata,
  });

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nativeEvent = event.nativeEvent as SubmitEvent;
      console.log("[FlexJar DEBUG] handleSubmit triggered", {
        shouldSubmit,
        isLastStep,
        currentStep,
        currentStepQuestion: currentStepQuestion?.id,
        submitter: nativeEvent.submitter?.textContent,
        submitterType: (nativeEvent.submitter as HTMLButtonElement)?.type,
      });
      await submit();
    },
    [submit, shouldSubmit, isLastStep, currentStep, currentStepQuestion],
  );

  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  const handleCloseDock = useCallback(() => {
    if (isSuccess && hideAfterSubmit) {
      closeDock(true);
    } else {
      closeDock();
    }
  }, [closeDock, isSuccess, hideAfterSubmit]);

  useAutoCloseOnSuccess({
    enabled: autoCloseOnSuccess,
    status,
    delayMs: successCloseDelayMs,
    onClose: handleCloseDock,
  });
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
      /**
       * Special rendering for the rating question type.
       * Can now be any question in the list, but we keep the special UI for it.
       */
      if (props.question.type === "rating") {
        const rating = props.question as RatingQuestion;
        const isPromptQuestion = props.question.id === promptQuestion.id;

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
                hidePrompt={isPromptQuestion} // Only hide prompt if it's the header question
                hideDescription={isPromptQuestion}
                hideValueLabels
                wrap={false}
                ariaLabelledBy={isPromptQuestion ? promptHeadingId : undefined}
                ariaDescribedBy={isPromptQuestion ? promptDescriptionId : undefined}
                rowClassName={CLASS_NAMES.ratingRow}
                buttonClassName={CLASS_NAMES.ratingButton}
                fieldsetPaddingBlock="space-8"
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
          hideLabel={props.hideLabel}
        />
      );
    },
    [promptDescriptionId, promptHeadingId, promptQuestion.id, validationErrorMessage],
  );

  const noticeContent = personalDataNotice ?? DEFAULT_PERSONAL_DATA_NOTICE;

  // Don't render anything while loading persisted state
  if (isLoading) {
    return null;
  }

  // Don't render anything when dismissed with hideCompletely flag
  if (dismissed && shouldHideCompletely) {
    return null;
  }

  return (
    <aside
      className={joinClassNames(CLASS_NAMES.container, containerClassName)}
      style={containerStyle}
      data-feedback-id={feedbackId}
      data-state={dismissed ? "dismissed" : "open"}
      aria-label="Tilbakemeldingspanel"
    >
      {dismissed ? (
        <MinimizedDock
          label={minimizedButtonLabel}
          panelId={panelId}
          onReopen={reopenDock}
          className={CLASS_NAMES.minimizedButton}
        />
      ) : (
        <DockPanel
          panelId={panelId}
          panelLabel="Gi tilbakemelding"
          panelClassName={panelClassName}
          panelStyle={panelStyle}
          panelBackground={panelBackground}
          panelBorderColor={panelBorderColor}
          promptQuestion={promptQuestion}
          promptHeadingId={promptHeadingId}
          promptDescriptionId={promptDescriptionId}
          successHeadingId={successHeadingId}
          successTitle={successTitle}
          successBody={successBody}
          successPrimaryLabel={successPrimaryLabel}
          isSuccess={isSuccess}
          onClose={handleCloseDock}
          onSubmit={handleSubmit}
          orderedQuestions={questions}
          answers={answers}
          renderQuestion={defaultQuestionRenderer}
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
          // Step mode props for branching
          isStepMode={isStepMode}
          currentStep={currentStep}
          currentStepQuestion={currentStepQuestion}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          isLastStep={isLastStep || shouldSubmit}
          onNext={goToNext}
          onBack={goToPrevious}
        />
      )}
    </aside>
  );
};

FlexJarDock.displayName = "FlexJarDock";
