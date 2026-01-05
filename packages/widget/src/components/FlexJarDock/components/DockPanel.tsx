import React from "react";
import {
  Alert,
  BodyShort,
  Box,
  Button,
  Heading,
  HStack,
  VStack,
} from "@navikt/ds-react";
import type { BoxNewProps } from "@navikt/ds-react/Box";
import type {
  FlexJarAnswerValue,
  FlexJarQuestion,
} from "../../../core";
import type { FlexJarRenderQuestionProps } from "../../../types.js";
import { SuccessContent } from "./SuccessContent.js";
import { CLASS_NAMES, joinClassNames } from "../classNames.js";

interface DockPanelProps {
  panelId: string;
  panelLabel: string;
  panelClassName?: string;
  panelStyle: React.CSSProperties;
  panelBackground: BoxNewProps["background"];
  panelBorderColor?: BoxNewProps["borderColor"];
  promptQuestion: FlexJarQuestion;
  promptHeadingId: string;
  promptDescriptionId?: string;
  successHeadingId: string;
  successTitle: string;
  successBody?: React.ReactNode;
  successPrimaryLabel: string;
  isSuccess: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  orderedQuestions: FlexJarQuestion[];
  answers: Record<string, FlexJarAnswerValue>;
  renderQuestion: (props: FlexJarRenderQuestionProps) => React.ReactNode;
  validationMissing: string[];
  isSubmitting: boolean;
  submitLabel: string;
  submitPendingLabel: string;
  cancelLabel: string;
  showPersonalDataNotice: boolean;
  personalDataNotice?: React.ReactNode;
  isSubmitBlocked: boolean;
  hasTransportError: boolean;
  transportErrorMessage: string;
  shouldDeferQuestion: (question: FlexJarQuestion) => boolean;
  onQuestionChange: (
    questionId: string,
    value: FlexJarAnswerValue | null | undefined,
  ) => void;
  // Step mode props (branching logic)
  isStepMode?: boolean;
  currentStep?: number;
  currentStepQuestion?: FlexJarQuestion;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isLastStep?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
}

export const DockPanel = ({
  panelId,
  panelLabel,
  panelClassName,
  panelStyle,
  panelBackground,
  panelBorderColor,
  promptQuestion,
  promptHeadingId,
  promptDescriptionId,
  successHeadingId,
  successTitle,
  successBody,
  successPrimaryLabel,
  isSuccess,
  onClose,
  onSubmit,
  orderedQuestions,
  answers,
  renderQuestion,
  validationMissing,
  isSubmitting,
  submitLabel,
  submitPendingLabel,
  cancelLabel,
  showPersonalDataNotice,
  personalDataNotice,
  isSubmitBlocked,
  hasTransportError,
  transportErrorMessage,
  shouldDeferQuestion,
  onQuestionChange,
  // Step mode props
  isStepMode = false,
  currentStep = 0,
  currentStepQuestion,
  canGoBack = false,
  canGoNext = true,
  isLastStep = false,
  onNext,
  onBack,
  nextLabel = "Neste",
  backLabel = "Tilbake",
}: DockPanelProps) => {
  return (
    <div style={{ position: "relative" }}>
      <Box.New
        padding="space-16"
        background={panelBackground}
        borderRadius="large"
        shadow="dialog"
        borderWidth={panelBorderColor ? "1" : undefined}
        borderColor={panelBorderColor}
        className={joinClassNames(CLASS_NAMES.panel, panelClassName)}
        style={panelStyle}
        aria-labelledby={isSuccess ? successHeadingId : promptHeadingId}
        id={panelId}
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
                  id={promptHeadingId}
                >
                  {promptQuestion.prompt}
                </Heading>
                {promptQuestion.description && (
                  <BodyShort
                    size="small"
                    className={CLASS_NAMES.ratingDescription}
                    id={promptDescriptionId}
                  >
                    {promptQuestion.description}
                  </BodyShort>
                )}
              </>
            )}
          </div>
        </div>

        {isSuccess ? (
          <VStack gap="space-16">
            <SuccessContent
              title={successTitle}
              body={successBody}
              showTitle={false}
              announce={Boolean(successBody)}
            />
            <Button onClick={onClose}>{successPrimaryLabel}</Button>
          </VStack>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <VStack gap="space-16">
              {isStepMode && currentStepQuestion ? (
                // Step mode: Show only the current question
                <>
                  <div className="flexjar-question">
                    {renderQuestion({
                      question: currentStepQuestion,
                      value: answers[currentStepQuestion.id],
                      onChange: (nextValue) =>
                        onQuestionChange(currentStepQuestion.id, nextValue),
                      isMissing: validationMissing.includes(currentStepQuestion.id),
                      disabled: isSubmitting,
                      hideLabel: currentStepQuestion.id === promptQuestion.id,
                    })}
                  </div>

                  {hasTransportError && (
                    <Alert variant="error" role="alert">
                      {transportErrorMessage}
                    </Alert>
                  )}

                  {/* Show privacy notice only on last step before submit */}
                  {showPersonalDataNotice && isLastStep && (
                    <Alert variant="warning" role="alert">
                      {personalDataNotice}
                    </Alert>
                  )}

                  <HStack gap="space-8" wrap>
                    {canGoBack && (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={onBack}
                        disabled={isSubmitting}
                      >
                        {backLabel}
                      </Button>
                    )}
                    {isLastStep ? (
                      <Button
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting || !canGoNext}
                      >
                        {isSubmitting ? submitPendingLabel : submitLabel}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={onNext}
                        disabled={isSubmitting || !canGoNext}
                      >
                        {nextLabel}
                      </Button>
                    )}
                    <Button variant="tertiary" type="button" onClick={onClose}>
                      {cancelLabel}
                    </Button>
                  </HStack>
                </>
              ) : (
                // Legacy mode: Show all questions at once
                <>
                  {orderedQuestions.map((question) => {
                    if (shouldDeferQuestion(question)) {
                      return null;
                    }

                    const value = answers[question.id];
                    const isMissing = validationMissing.includes(question.id);
                    const handleChange = (
                      nextValue: FlexJarAnswerValue | null | undefined,
                    ) => {
                      onQuestionChange(question.id, nextValue);
                    };

                    return (
                      <div key={question.id} className="flexjar-question">
                        {renderQuestion({
                          question,
                          value,
                          onChange: handleChange,
                          isMissing,
                          disabled: isSubmitting,
                          hideLabel: question.id === promptQuestion.id,
                        })}
                      </div>
                    );
                  })}

                  {hasTransportError && (
                    <Alert variant="error" role="alert">
                      {transportErrorMessage}
                    </Alert>
                  )}

                  {showPersonalDataNotice && !isSubmitBlocked && (
                    <Alert variant="warning" role="alert">
                      {personalDataNotice}
                    </Alert>
                  )}

                  <HStack gap="space-8" wrap>
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      disabled={isSubmitting || isSubmitBlocked}
                    >
                      {isSubmitting ? submitPendingLabel : submitLabel}
                    </Button>
                    <Button variant="tertiary" type="button" onClick={onClose}>
                      {cancelLabel}
                    </Button>
                  </HStack>
                </>
              )}
            </VStack>
          </form>
        )}
      </Box.New>
    </div>
  );
};

DockPanel.displayName = "FlexJarDockPanel";
