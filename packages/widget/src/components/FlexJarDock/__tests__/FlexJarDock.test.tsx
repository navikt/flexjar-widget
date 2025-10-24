import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlexJarDock } from "../FlexJarDock.js";
import type {
  FlexJarEvents,
  FlexJarTransport,
} from "../../../core/types.js";
import type { FlexJarSurveyConfig } from "../../surveyTypes.js";

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
}) {
  const transport: FlexJarTransport =
    options?.transport ?? {
      submit: vi.fn().mockResolvedValue(undefined),
    };

  render(
    <FlexJarDock
      feedbackId="dock-feedback"
      survey={options?.survey ?? createSurvey()}
      transport={transport}
      events={options?.events}
      context={options?.context}
    />,
  );

  return { transport };
}

describe("FlexJarDock", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
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

  it("persists dismissal state and triggers reset when closing", async () => {
    const events: FlexJarEvents = {
      onReset: vi.fn(),
    };

    const user = userEvent.setup();
    renderDock({ events });

    expect(window.sessionStorage.getItem("flexjar-dock-dismissed:dock-feedback")).toBeNull();

    const closeButtons = screen.getAllByRole("button", { name: /avbryt/i });
    await user.click(closeButtons[0]);

    expect(window.sessionStorage.getItem("flexjar-dock-dismissed:dock-feedback")).toBe("1");
    expect(events.onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("region", { name: /gi tilbakemelding/i })).toBeNull();
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
