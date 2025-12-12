import { useMemo } from "react";
import type { FlexJarAnswerValue, FlexJarQuestion } from "../../../core/types.js";

export interface QuestionGateResult {
    /**
     * The question that gates other questions, if any.
     */
    gateQuestion: FlexJarQuestion | undefined;

    /**
     * Whether the gate question has been answered.
     * Always true if no gate question is configured.
     */
    isGateAnswered: boolean;

    /**
     * Returns true if the given question should be hidden because gate is unanswered.
     */
    shouldDeferQuestion: (question: FlexJarQuestion) => boolean;

    /**
     * Whether submit should be blocked.
     * True only if gate question exists and is not answered.
     */
    isSubmitBlocked: boolean;
}

export function useQuestionGate(
    questions: FlexJarQuestion[],
    answers: Record<string, FlexJarAnswerValue | undefined>,
    gateQuestionId: string | undefined,
): QuestionGateResult {
    const gateQuestion = useMemo(
        () => (gateQuestionId ? questions.find(q => q.id === gateQuestionId) : undefined),
        [questions, gateQuestionId]
    );

    const gateAnswer = gateQuestion ? answers[gateQuestion.id] : undefined;
    const isGateAnswered = gateQuestion
        ? gateAnswer !== undefined && gateAnswer !== null
        : true; // No gate = always considered answered

    const shouldDeferQuestion = useMemo(
        () => (question: FlexJarQuestion): boolean => {
            if (!gateQuestion) return false; // No gate = show all questions
            if (question.id === gateQuestion.id) return false; // Never defer the gate question itself
            return !isGateAnswered;
        },
        [gateQuestion, isGateAnswered]
    );

    // Block submit only if gate question exists and is not answered
    const isSubmitBlocked = Boolean(gateQuestion && !isGateAnswered);

    return {
        gateQuestion,
        isGateAnswered,
        shouldDeferQuestion,
        isSubmitBlocked,
    };
}
