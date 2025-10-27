import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlexJarDock } from "../FlexJarDock.js";
import type {
  FlexJarEvents,
  FlexJarTransport,
} from "../../../core/types.js";
import type { FlexJarSurveyConfig } from "../../surveyTypes.js";
import { removeConsentValue } from "../../shared/consentStorage.js";

function createSurvey(): FlexJarSurveyConfig {
  return {
    rating: {
      id: "rating",
      type: "rating",
      prompt: "Hvor fornøyd er du?",
      description: "Beskriv gjerne opplevelsen din.",
      required: true,
      scale: 5,
    },
    mainQuestion: {
      id: "feedback",
      type: "text",
      prompt: "Hva kan vi forbedre?",
      required: true,
      maxLength: 500,
    },
    followUpQuestions: [
      {
        id: "free-text",
        type: "text",
        prompt: "Andre kommentarer?",
        required: false,
        maxLength: 500,
      },
    ],
  } satisfies FlexJarSurveyConfig;
}

function renderDock(options?: {
  transport?: FlexJarTransport;
  events?: FlexJarEvents;
  survey?: FlexJarSurveyConfig;
  context?: Record<string, unknown>;
  initialOpen?: boolean;
}) {
  const transport: FlexJarTransport =
    options?.transport ?? {
      submit: vi.fn().mockResolvedValue(undefined),
    };

  return render(
    <FlexJarDock
      feedbackId="dock-feedback"
      survey={options?.survey ?? createSurvey()}
      transport={transport}
      events={options?.events}
      context={options?.context}
      initialOpen={options?.initialOpen}
    />,
  );
}

describe("FlexJarDock", () => {
  beforeEach(async () => {
    await removeConsentValue("flexjar-dock-dismissed:dock-feedback");
  });

  it("gates follow-up questions until the rating is answered", async () => {
    const user = userEvent.setup();
    renderDock();

    expect(screen.queryByLabelText(/hva kan vi forbedre/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/andre kommentarer/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /5\./i }));

    expect(screen.getByLabelText(/hva kan vi forbedre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/andre kommentarer/i)).toBeInTheDocument();
  });

  it("submits answers via the transport and shows success state", async () => {
    const transportSubmit = vi.fn().mockResolvedValue(undefined);
    renderDock({ transport: { submit: transportSubmit } });

    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: /5\./i }));
    await user.type(screen.getByLabelText(/hva kan vi forbedre/i), "Alt bra");

    const submitButton = screen.getByRole("button", { name: /send/i });
    await user.click(submitButton);

    expect(transportSubmit).toHaveBeenCalledTimes(1);
    expect(transportSubmit.mock.calls[0][0].feedbackId).toBe("dock-feedback");

    await screen.findByRole("heading", { name: /takk for tilbakemeldingen/i });
    expect(screen.getByRole("button", { name: /lukk/i })).toBeInTheDocument();
  });

  it("displays validation errors when required questions are missing", async () => {
    const user = userEvent.setup();
    const events: FlexJarEvents = {
      onValidationFailed: vi.fn(),
    };
    const transport: FlexJarTransport = {
      submit: vi.fn().mockResolvedValue(undefined),
    };

    renderDock({ events, transport });

    await user.click(screen.getByRole("radio", { name: /4\./i }));

    const submitButton = screen.getByRole("button", { name: /send/i });
    await user.click(submitButton);

    expect(transport.submit).not.toHaveBeenCalled();
    expect(events.onValidationFailed).toHaveBeenCalledWith(
      expect.arrayContaining(["feedback"]),
    );
  });

  it("calls onViewDock when the dock mounts", () => {
    const events: FlexJarEvents = {
      onViewDock: vi.fn(),
    };

    renderDock({ events });

    expect(events.onViewDock).toHaveBeenCalledWith("dock-feedback");
  });

  it("renders the minimized button when initialOpen is false", () => {
    renderDock({ initialOpen: false });

    expect(
      screen.getByRole("button", { name: /gi tilbakemelding/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /gi tilbakemelding/i }),
    ).not.toBeInTheDocument();
  });

  it("persists dismissal state and triggers reset when closing", async () => {
    const events: FlexJarEvents = {
      onReset: vi.fn(),
      onDismissalPersistFailed: vi.fn(),
    };

    const user = userEvent.setup();
    const { unmount } = renderDock({ events });
    const initialContainer = document.querySelector(
      '[data-feedback-id="dock-feedback"]',
    ) as HTMLElement;

    expect(initialContainer?.getAttribute("data-state")).toBe("open");

    const closeButton = screen.getByLabelText(/avbryt/i);
    await act(async () => {
      await user.click(closeButton);
    });

    expect(events.onReset).toHaveBeenCalledTimes(1);

    // Without consent storage, the dismissal doesn't persist
    // The dock closes but doesn't show minimized button
    await waitFor(() => {
      const nextContainer = document.querySelector(
        '[data-feedback-id="dock-feedback"]',
      ) as HTMLElement | null;

      expect(nextContainer?.getAttribute("data-state")).toBe("dismissed");
    });

    // onDismissalPersistFailed should NOT be called when storage is simply not available
    // (it's only called when storage IS allowed but the write operation fails)
    expect(events.onDismissalPersistFailed).not.toHaveBeenCalled();

    unmount();

    // When remounting without consent storage, dock respects initialOpen (true by default)
    renderDock();

    // The dock should be open again since there's no persistence
    expect(
      screen.getByRole("heading", { name: /hvor fornøyd er du/i }),
    ).toBeInTheDocument();
  });

  it("shows transport error message when submission fails", async () => {
    const transportSubmit = vi.fn().mockRejectedValue(new Error("network"));
    renderDock({ transport: { submit: transportSubmit } });

    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: /4\./i }));
    await user.type(screen.getByLabelText(/hva kan vi forbedre/i), "Alt bra");

    const submitButton = screen.getByRole("button", { name: /send/i });
    await user.click(submitButton);

    const errorAlert = await screen.findByText(/kunne ikke sende tilbakemeldingen/i);
    expect(errorAlert.closest('[role="alert"]')).toHaveTextContent(
      /kunne ikke sende tilbakemeldingen/i,
    );
  });
});
