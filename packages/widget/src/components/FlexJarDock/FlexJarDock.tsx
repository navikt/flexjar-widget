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

export interface FlexJarDockProps {
  /**
   * Unique identifier for this feedback instance. Used for localStorage persistence keys and event tracking.
   * @example "oppfolgingsplan-feedback"
   */
  feedbackId: string;

  /**
   * Survey configuration defining the questions to display.
   * Must include a rating question and main question, with optional follow-up questions.
   */
  survey: FlexJarSurveyConfig;

  /**
   * Transport implementation for submitting feedback data.
   * Receives the formatted submission payload and returns a promise.
   */
  transport: FlexJarTransport;

  /**
   * Optional event callbacks for tracking user interactions and lifecycle events.
   * Includes onViewDock, onSubmit, onSubmitSuccess, onSubmitError, etc.
   */
  events?: FlexJarEvents;

  /**
   * Additional context data to include with submissions (e.g., user metadata, page info).
   * Will be merged into the transportPayload.
   */
  context?: Record<string, unknown>;

  /**
   * Custom metadata for segmentation/filtering in analytics.
   * Use this for business-specific context like { harDialogmote: true, sykmeldingstype: "avventende" }.
   * This data becomes visible and filterable in the analytics dashboard.
   */
  metadata?: Record<string, unknown>;

  /**
   * Label for the submit button.
   * @default "Send inn"
   */
  submitLabel?: string;

  /**
   * Label shown on the submit button while submission is in progress.
   * @default "Sender inn..."
   */
  submitPendingLabel?: string;

  /**
   * Label for the cancel button (currently not used in dock UI).
   * @default "Lukk"
   */
  cancelLabel?: string;

  /**
   * Error message shown when required fields are missing.
   * @default "Vennligst fyll ut alle påkrevde felt"
   */
  validationErrorMessage?: string;

  /**
   * Error message shown when submission fails due to transport/network errors.
   * @default "Noe gikk galt ved innsending. Prøv igjen senere."
   */
  transportErrorMessage?: string;

  /**
   * Title shown on the success screen after successful submission.
   * @default "Takk for tilbakemeldingen!"
   */
  successTitle?: string;

  /**
   * Optional body content displayed on the success screen.
   * Can be a string or React element.
   */
  successBody?: ReactNode;

  /**
   * Label for the primary action button on the success screen ("Lukk").
   * @default "Lukk"
   */
  successPrimaryLabel?: string;

  /**
   * Whether to reset the form state when the dock is closed/dismissed.
   * @default true
   */
  resetOnClose?: boolean;

  /**
   * Whether to automatically close the dock after successful submission.
   * When true, closes after `successCloseDelayMs` milliseconds.
   * @default false
   */
  autoCloseOnSuccess?: boolean;

  /**
   * Delay in milliseconds before auto-closing the dock after success (when `autoCloseOnSuccess` is true).
   * @default 1600
   */
  successCloseDelayMs?: number;

  /**
   * Whether to show the personal data notice at the bottom of the form.
   * @default true
   */
  showPersonalDataNotice?: boolean;

  /**
   * Custom content for the personal data notice.
   * If not provided, uses the default NAV privacy notice.
   */
  personalDataNotice?: ReactNode;

  /**
   * Position of the dock on the screen.
   * @default "bottom-right"
   */
  position?: "bottom-right" | "bottom-left";

  /**
   * Offset in pixels from the bottom and side edges of the viewport.
   * @default 24
   */
  offset?: number;

  /**
   * Additional CSS class name for the dock container element.
   */
  containerClassName?: string;

  /**
   * Additional CSS class name for the dock panel element.
   */
  panelClassName?: string;

  /**
   * Background color for the dock panel using NAV Design System Darkside tokens.
   * @default "default"
   */
  panelBackground?: BoxNewProps["background"];

  /**
   * Border color for the dock panel using NAV Design System Darkside tokens.
   * @default "neutral-subtle"
   */
  panelBorderColor?: BoxNewProps["borderColor"];

  /**
   * Whether the dock should be open or minimized on initial render.
   * @default true
   */
  initialOpen?: boolean;

  /**
   * Custom label for the minimized dock button.
   * @default "Gi tilbakemelding"
   */
  minimizedButtonLabel?: string;

  /**
   * Number of days before a dismissed dock can be shown again.
   * Set to 0 to disable cooldown (dock can be reopened immediately).
   * @default 30
   */
  dismissCooldownDays?: number;

  /**
   * Controls dock behavior after successful submission.
   * - true: Dock is completely hidden (no minimized button) and stays hidden across page reloads for the cooldown period
   * - false: Dock is minimized (shows small button) and can be reopened
   * @default true
   */
  hideAfterSubmit?: boolean;
}

export const FlexJarDock = ({
  feedbackId,
  survey,
  transport,
  events,
  context,
  metadata,
  submitLabel = DEFAULT_COPY.submitLabel,
  submitPendingLabel = DEFAULT_COPY.submitPendingLabel,
  cancelLabel = DEFAULT_COPY.cancelLabel,
  validationErrorMessage = DEFAULT_COPY.validationErrorMessage,
  transportErrorMessage = DEFAULT_COPY.transportErrorMessage,
  successTitle = DEFAULT_COPY.successTitle,
  successBody = DEFAULT_COPY.successBody,
  successPrimaryLabel = DEFAULT_COPY.successPrimaryLabel,
  resetOnClose = true,
  autoCloseOnSuccess = false,
  successCloseDelayMs = 1600,
  showPersonalDataNotice = true,
  personalDataNotice,
  position = "bottom-right",
  offset = 24,
  containerClassName,
  panelClassName,
  panelBackground = "default",
  panelBorderColor = "neutral-subtle",
  initialOpen = true,
  minimizedButtonLabel,
  dismissCooldownDays = 30,
  hideAfterSubmit = true,
}: FlexJarDockProps) => {
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
      await submit();
    },
    [submit],
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

  const reopenLabel = minimizedButtonLabel ?? "Gi tilbakemelding";
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
    </div>
  );
};

FlexJarDock.displayName = "FlexJarDock";
