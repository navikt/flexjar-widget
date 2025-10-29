import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlexJarEvents } from "../../../core/types.js";
import {
  readConsentValue,
  removeConsentValue,
  writeConsentValue,
} from "../../shared/consentStorage.js";

const MS_IN_DAY = 86_400_000;

interface PersistedDismissalState {
  version?: number;
  state?: "dismissed";
  dismissedAt?: string;
  resumeAt?: string | null;
  hideCompletely?: boolean;
}

const parsePersistedDismissal = (raw: string): PersistedDismissalState | null => {
  try {
    return JSON.parse(raw) as PersistedDismissalState;
  } catch {
    return null;
  }
};

const isResumeExpired = (resumeAt: string | null | undefined): boolean => {
  if (!resumeAt) {
    return false;
  }

  const resumeTime = Date.parse(resumeAt);
  if (Number.isNaN(resumeTime)) {
    return false;
  }

  return resumeTime <= Date.now();
};

export interface UsePersistedDismissalOptions {
  feedbackId: string;
  initialOpen: boolean;
  dismissCooldownDays: number;
  events?: FlexJarEvents;
  resetOnClose: boolean;
  onReset: () => void;
}

export interface UsePersistedDismissalReturn {
  dismissed: boolean;
  shouldHideCompletely: boolean;
  isLoading: boolean;
  closeDock: (hideCompletely?: boolean) => void;
  reopenDock: () => void;
}

export const usePersistedDismissal = (
  options: UsePersistedDismissalOptions,
): UsePersistedDismissalReturn => {
  const {
    feedbackId,
    initialOpen,
    dismissCooldownDays,
    events,
    resetOnClose,
    onReset,
  } = options;

  const storageKey = useMemo(
    () => `flexjar-dismissed-${feedbackId}`,
    [feedbackId],
  );
  const [dismissed, setDismissed] = useState<boolean>(() => !initialOpen);
  const [shouldHideCompletely, setShouldHideCompletely] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadDismissedState = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const persistedValue = await readConsentValue(storageKey);

      if (cancelled) {
        return;
      }

      if (!persistedValue) {
        if (!userInteractedRef.current) {
          setDismissed(!initialOpen);
        }
        setIsLoading(false);
        return;
      }

      if (persistedValue === "1") {
        if (!userInteractedRef.current) {
          setDismissed(true);
        }
        setIsLoading(false);
        return;
      }

      const parsed = parsePersistedDismissal(persistedValue);
      if (!parsed) {
        if (!userInteractedRef.current) {
          setDismissed(true);
        }
        setIsLoading(false);
        return;
      }

      if (isResumeExpired(parsed.resumeAt ?? null)) {
        await removeConsentValue(storageKey);
        if (!cancelled && !userInteractedRef.current) {
          setDismissed(!initialOpen);
          setShouldHideCompletely(false);
        }
        setIsLoading(false);
        return;
      }

      if (!userInteractedRef.current) {
        setDismissed(true);
        setShouldHideCompletely(parsed.hideCompletely ?? false);
      }
      setIsLoading(false);
    };

    void loadDismissedState();

    return () => {
      cancelled = true;
    };
  }, [initialOpen, storageKey]);

  useEffect(() => {
    if (!dismissed) {
      events?.onViewDock?.(feedbackId);
    }
  }, [dismissed, events, feedbackId]);

  const persistDismissedState = useCallback(
    async (nextDismissed: boolean, hideCompletely?: boolean) => {
      if (nextDismissed) {
        const now = new Date();
        const resumeAt =
          dismissCooldownDays > 0
            ? new Date(now.getTime() + dismissCooldownDays * MS_IN_DAY)
                .toISOString()
            : undefined;

        const payload: PersistedDismissalState = {
          version: 1,
          state: "dismissed",
          dismissedAt: now.toISOString(),
          resumeAt: resumeAt ?? null,
          hideCompletely: hideCompletely ?? false,
        };

        try {
          const result = await writeConsentValue(
            storageKey,
            JSON.stringify(payload),
          );
          if (result.allowed && !result.persisted) {
            events?.onDismissalPersistFailed?.(result.error);
          }
        } catch (persistError) {
          events?.onDismissalPersistFailed?.(persistError);
        }
        return;
      }

      try {
        await removeConsentValue(storageKey);
      } catch (persistError) {
        events?.onDismissalPersistFailed?.(persistError);
      }
    },
    [dismissCooldownDays, events, storageKey],
  );

  const closeDock = useCallback((hideCompletely?: boolean) => {
    if (dismissed) {
      return;
    }

    if (resetOnClose) {
      onReset();
    }

    userInteractedRef.current = true;
    setDismissed(true);
    setShouldHideCompletely(hideCompletely ?? false);
    void persistDismissedState(true, hideCompletely);
  }, [dismissed, persistDismissedState, resetOnClose, onReset]);

  const reopenDock = useCallback(() => {
    if (!dismissed) {
      return;
    }

    userInteractedRef.current = true;
    setDismissed(false);
    setShouldHideCompletely(false);
    void persistDismissedState(false);
  }, [dismissed, persistDismissedState]);

  return {
    dismissed,
    shouldHideCompletely,
    isLoading,
    closeDock,
    reopenDock,
  };
};
