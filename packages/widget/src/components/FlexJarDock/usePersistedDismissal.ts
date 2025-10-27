import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlexJarEvents } from "../../core/types.js";
import {
  readConsentValue,
  removeConsentValue,
  writeConsentValue,
} from "../shared/consentStorage.js";

const MS_IN_DAY = 86_400_000;

interface PersistedDismissalState {
  version?: number;
  state?: "dismissed";
  dismissedAt?: string;
  resumeAt?: string | null;
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
  closeDock: () => void;
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
    () => `flexjar-dock-dismissed:${feedbackId}`,
    [feedbackId],
  );
  const [dismissed, setDismissed] = useState<boolean>(() => !initialOpen);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadDismissedState = async () => {
      if (typeof window === "undefined") {
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
        return;
      }

      if (persistedValue === "1") {
        if (!userInteractedRef.current) {
          setDismissed(true);
        }
        return;
      }

      const parsed = parsePersistedDismissal(persistedValue);
      if (!parsed) {
        if (!userInteractedRef.current) {
          setDismissed(true);
        }
        return;
      }

      if (isResumeExpired(parsed.resumeAt ?? null)) {
        await removeConsentValue(storageKey);
        if (!cancelled && !userInteractedRef.current) {
          setDismissed(!initialOpen);
        }
        return;
      }

      if (!userInteractedRef.current) {
        setDismissed(true);
      }
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
    async (nextDismissed: boolean) => {
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

  const closeDock = useCallback(() => {
    if (dismissed) {
      return;
    }

    if (resetOnClose) {
      onReset();
    }

    userInteractedRef.current = true;
    setDismissed(true);
    void persistDismissedState(true);
  }, [dismissed, persistDismissedState, resetOnClose, onReset]);

  const reopenDock = useCallback(() => {
    if (!dismissed) {
      return;
    }

    userInteractedRef.current = true;
    setDismissed(false);
    void persistDismissedState(false);
  }, [dismissed, persistDismissedState]);

  return {
    dismissed,
    closeDock,
    reopenDock,
  };
};
