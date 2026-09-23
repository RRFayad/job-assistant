import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { fetchProfileSuggestion } from "@/lib/backend/profile";
import type { SuggestionTarget } from "@/lib/backend/profile";

import { AskAiPanel } from "./ask-ai-panel";

vi.mock("@/lib/backend/profile", () => ({
  fetchProfileSuggestion: vi.fn(),
}));

const textTarget = (body: string): SuggestionTarget => ({
  kind: "section",
  section: { id: "s1", type: "text", title: "Summary", body },
});

describe("AskAiPanel", () => {
  it("fetches a suggestion when opened and shows it with Accept/Dismiss", async () => {
    const suggestion = textTarget("Original. Suggested addition.");
    vi.mocked(fetchProfileSuggestion).mockResolvedValue(suggestion);
    const onAccept = vi.fn();

    render(<AskAiPanel target={textTarget("Original.")} onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: /ask ai/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Accept" })).toBeDefined(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(onAccept).toHaveBeenCalledWith(suggestion);
  });

  it("does not apply a stale suggestion fetched before an intervening edit", async () => {
    const staleSuggestion = textTarget("Original. Stale suggestion.");
    vi.mocked(fetchProfileSuggestion).mockResolvedValue(staleSuggestion);
    const onAccept = vi.fn();

    const { rerender } = render(
      <AskAiPanel target={textTarget("Original.")} onAccept={onAccept} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /ask ai/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Accept" })).toBeDefined(),
    );

    // Close without accepting, simulate an edit to the underlying content,
    // then reopen — this must fetch fresh rather than reuse the cached one.
    fireEvent.click(screen.getByRole("button", { name: /ask ai/i }));
    rerender(
      <AskAiPanel
        target={textTarget("Original. User typed more.")}
        onAccept={onAccept}
      />,
    );

    const freshSuggestion = textTarget(
      "Original. User typed more. Fresh suggestion.",
    );
    vi.mocked(fetchProfileSuggestion).mockResolvedValue(freshSuggestion);
    fireEvent.click(screen.getByRole("button", { name: /ask ai/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Accept" })).toBeDefined(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(freshSuggestion);
  });

  it("allows retrying after a failed fetch", async () => {
    vi.mocked(fetchProfileSuggestion).mockResolvedValueOnce(null);
    render(<AskAiPanel target={textTarget("Original.")} onAccept={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /ask ai/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to get a suggestion.")).toBeDefined(),
    );

    const suggestion = textTarget("Original. Recovered.");
    vi.mocked(fetchProfileSuggestion).mockResolvedValueOnce(suggestion);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Accept" })).toBeDefined(),
    );
  });
});
