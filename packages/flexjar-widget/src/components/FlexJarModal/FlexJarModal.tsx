import React, { useCallback, useEffect, useId, useMemo } from "react";
import {
  Alert,
  BodyLong,
  Button,
  Heading,
  HStack,
  Modal,
  VStack,
} from "@navikt/ds-react";
import { MagnifyingGlassIcon } from "@navikt/aksel-icons";
import { useFlexJar } from "../../core/useFlexJar.js";
import type {
  FlexJarAnswerValue,
  FlexJarEvents,
  FlexJarQuestion,
  FlexJarTransport,
  RatingQuestion,
} from "../../core/types.js";
import { SuccessContent } from "./SuccessContent.js";
import { DefaultQuestionRenderer } from "../questions/index.js";
import { useAutoCloseOnSuccess } from "./useAutoCloseOnSuccess.js";
import { useRatingGate } from "./useRatingGate.js";
import type { FlexJarRenderQuestionProps } from "../../types.js";

export interface FlexJarSurveyConfig {
  rating: RatingQuestion;
  mainQuestion: FlexJarMainQuestion;
  followUpQuestions?: FlexJarFollowUpQuestion[];
}

export type FlexJarFollowUpQuestion = Exclude<FlexJarQuestion, { type: "rating" }>;
export type FlexJarMainQuestion = Extract<FlexJarQuestion, { type: "text" }>;

export interface FlexJarModalProps {
  open: boolean;
  onClose: () => void;
  feedbackId: string;
  survey: FlexJarSurveyConfig;
  transport: FlexJarTransport;
  events?: FlexJarEvents;
  context?: Record<string, unknown>;
  title?: string;
  intro?: React.ReactNode;
  submitLabel?: string;
  submitPendingLabel?: string;
  cancelLabel?: string;
  validationErrorMessage?: string;
  transportErrorMessage?: string;
  successTitle?: string;
  successBody?: React.ReactNode;
  successPrimaryLabel?: string;
  className?: string;
  renderQuestion?: (props: FlexJarRenderQuestionProps) => React.ReactNode;
  resetOnClose?: boolean;
  autoCloseOnSuccess?: boolean;
  successCloseDelayMs?: number;
  showPersonalDataNotice?: boolean;
  personalDataNotice?: React.ReactNode;
}

const DEFAULT_COPY = {
  submitLabel: "Send",
  submitPendingLabel: "Sender…",
  cancelLabel: "Avbryt",
  validationErrorMessage: "Du må svare på spørsmålet.",
  transportErrorMessage: "Kunne ikke sende tilbakemeldingen. Prøv igjen senere.",
  successTitle: "Takk for tilbakemeldingen!",
  successBody: "Vi bruker svarene dine for å forbedre løsningen.",
  successPrimaryLabel: "Lukk",
};

const DEFAULT_PERSONAL_DATA_NOTICE = (
  <>
    Ikke skriv inn navn eller andre personopplysninger.
  </>
);

export const FlexJarModal = React.forwardRef<HTMLDialogElement, FlexJarModalProps>(
  function FlexJarModalInner(
    props: FlexJarModalProps,
    externalRef: React.ForwardedRef<HTMLDialogElement>,
  ) {
    const {
      open,
      onClose,
    feedbackId,
    survey,
      transport,
      events,
      context,
      title = "Gi tilbakemelding",
      intro,
      submitLabel = DEFAULT_COPY.submitLabel,
      submitPendingLabel = DEFAULT_COPY.submitPendingLabel,
      cancelLabel = DEFAULT_COPY.cancelLabel,
      validationErrorMessage = DEFAULT_COPY.validationErrorMessage,
      transportErrorMessage = DEFAULT_COPY.transportErrorMessage,
      successTitle = DEFAULT_COPY.successTitle,
      successBody = DEFAULT_COPY.successBody,
      successPrimaryLabel = DEFAULT_COPY.successPrimaryLabel,
      className,
      renderQuestion,
      resetOnClose = true,
      autoCloseOnSuccess = false,
      successCloseDelayMs = 1600,
      showPersonalDataNotice = true,
      personalDataNotice,
    } = props;

    const formId = useId();
    const headingId = useId();

    const ratingQuestion = survey.rating;
    const mainQuestion = survey.mainQuestion;
    const sanitizedFollowUps = useMemo(
      () => {
        const followUps = survey.followUpQuestions ?? [];
        return followUps.filter(
          (question) =>
            question.id !== ratingQuestion.id && question.id !== mainQuestion.id,
        );
      },
      [mainQuestion.id, ratingQuestion.id, survey.followUpQuestions],
    );

    const orderedQuestions = useMemo(
      () => [ratingQuestion, mainQuestion, ...sanitizedFollowUps],
      [mainQuestion, ratingQuestion, sanitizedFollowUps],
    );

    const { answers, status, error, setAnswer, submit, reset } = useFlexJar({
      feedbackId,
      questions: orderedQuestions,
      transport,
      events,
      context,
      coreQuestionIds: {
        rating: ratingQuestion.id,
        main: mainQuestion.id,
      },
    });

    useEffect(() => {
      if (open) {
        events?.onViewModal?.(feedbackId);
      }
    }, [events, feedbackId, open]);

    const handleClose = useCallback(() => {
      onClose();
      if (resetOnClose) {
        reset();
      }
    }, [onClose, reset, resetOnClose]);

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

    return (
      <Modal
        ref={externalRef}
        open={open}
        onClose={handleClose}
        className={className}
        aria-labelledby={headingId}
        data-feedback-id={feedbackId}
      >
        <Modal.Header closeButton>
          <HStack gap="2" align="center" id={headingId}>
            <MagnifyingGlassIcon aria-hidden height={24} width={24} />
            <Heading level="1" size="medium">
              {title}
            </Heading>
          </HStack>
        </Modal.Header>
        <Modal.Body>
          {isSuccess ? (
            <SuccessContent title={successTitle} body={successBody} />
          ) : (
            <form id={formId} onSubmit={handleSubmit} noValidate>
              <VStack gap="6">
                {intro && <BodyLong>{intro}</BodyLong>}
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
                      {renderQuestion ? (
                        renderQuestion({
                          question,
                          value,
                          onChange,
                          isMissing,
                          disabled: isSubmitting,
                        })
                      ) : (
                        <DefaultQuestionRenderer
                          question={question}
                          value={value}
                          onChange={onChange}
                          isMissing={isMissing}
                          disabled={isSubmitting}
                          validationErrorMessage={validationErrorMessage}
                        />
                      )}
                    </div>
                  );
                })}

                {error?.type === "validation" && (
                  <Alert variant="warning" role="alert">
                    {validationErrorMessage}
                  </Alert>
                )}

                {error?.type === "transport" && (
                  <Alert variant="error" role="alert">
                    {transportErrorMessage}
                  </Alert>
                )}

                {showPersonalDataNotice && !isSubmitBlocked && (
                  <Alert variant="warning" className="flexjar-personal-data-alert">
                    {personalDataNotice ?? DEFAULT_PERSONAL_DATA_NOTICE}
                  </Alert>
                )}
              </VStack>
            </form>
          )}
        </Modal.Body>

        <Modal.Footer>
          {isSuccess ? (
            <Button onClick={handleClose}>{successPrimaryLabel}</Button>
          ) : (
            <HStack gap="2" wrap>
              <Button
                type="submit"
                form={formId}
                loading={isSubmitting}
                disabled={isSubmitting || isSubmitBlocked}
              >
                {isSubmitting ? submitPendingLabel : submitLabel}
              </Button>
              <Button type="button" variant="secondary" onClick={handleClose}>
                {cancelLabel}
              </Button>
            </HStack>
          )}
        </Modal.Footer>
      </Modal>
    );
  },
);

FlexJarModal.displayName = "FlexJarModal";
