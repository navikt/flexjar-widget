import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock the nav-dekoratoren-moduler module
const mockGetCurrentConsent = vi.fn();

vi.mock("@navikt/nav-dekoratoren-moduler", () => ({
  getCurrentConsent: mockGetCurrentConsent,
}));

// Import after mocking
import { useConsentCheck } from "../useConsentCheck.js";

describe("useConsentCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when surveys consent is granted", async () => {
    mockGetCurrentConsent.mockResolvedValue({ surveys: true });

    const { result } = renderHook(() => useConsentCheck());

    // Initially null (loading)
    expect(result.current).toBe(null);

    // Wait for consent check to resolve
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("returns false when surveys consent is denied", async () => {
    mockGetCurrentConsent.mockResolvedValue({ surveys: false });

    const { result } = renderHook(() => useConsentCheck());

    expect(result.current).toBe(null);

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns false when surveys consent is undefined", async () => {
    mockGetCurrentConsent.mockResolvedValue({});

    const { result } = renderHook(() => useConsentCheck());

    expect(result.current).toBe(null);

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns false when getCurrentConsent throws an error", async () => {
    mockGetCurrentConsent.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useConsentCheck());

    expect(result.current).toBe(null);

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns false when nav-dekoratoren-moduler is not available", async () => {
    // This case is handled by the dynamic import catch block
    // In a real scenario, the import would fail
    mockGetCurrentConsent.mockImplementation(() => {
      throw new Error("Module not found");
    });

    const { result } = renderHook(() => useConsentCheck());

    expect(result.current).toBe(null);

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
