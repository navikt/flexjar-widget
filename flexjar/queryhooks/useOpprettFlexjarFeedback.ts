import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { post } from "../../../oppfolgingsplan-frontend/src/utils/fetch";
import { OpprettFeedbackData } from "../../../oppfolgingsplan-frontend/src/pages/api/flexjar";

export function useOpprettFlexjarFeedback(): UseMutationResult<
  OpprettFeedbackResponse,
  unknown,
  OpprettFeedbackData
> {
  const mutationFn = async (
    data: OpprettFeedbackData,
  ): Promise<OpprettFeedbackResponse> => {
    return post<OpprettFeedbackResponse>(
      `/syk/oppfolgingsplaner/api/flexjar`,
      data,
    );
  };

  return useMutation<OpprettFeedbackResponse, unknown, OpprettFeedbackData>({
    mutationFn,
  });
}

interface OpprettFeedbackResponse {
  id: string;
}
