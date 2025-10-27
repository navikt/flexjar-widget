interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface ConsentModule {
  awaitDecoratorData?: () => Promise<void>;
  isStorageKeyAllowed?: (key: string) => boolean;
  navLocalStorage?: StorageLike;
}

interface StorageResult {
  storage: StorageLike | null;
  allowed: boolean;
}

interface WriteResult {
  persisted: boolean;
  allowed: boolean;
  error?: unknown;
}

const memoryFallback = new Map<string, string>();

let modulePromise: Promise<ConsentModule | null> | null = null;

const loadConsentModule = async (): Promise<ConsentModule | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!modulePromise) {
    modulePromise = (async () => {
      try {
        const mod = await import("@navikt/nav-dekoratoren-moduler");
        if (typeof mod.awaitDecoratorData === "function") {
          try {
            await mod.awaitDecoratorData();
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console -- development diagnostics only
              console.warn("FlexJar: awaitDecoratorData failed", error);
            }
          }
        }
        return {
          awaitDecoratorData: mod.awaitDecoratorData,
          isStorageKeyAllowed: mod.isStorageKeyAllowed,
          navLocalStorage: mod.navLocalStorage,
        } satisfies ConsentModule;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console -- development diagnostics only
          console.warn(
            "FlexJar: nav-dekoratoren-moduler not available, falling back to in-memory storage.",
            error,
          );
        }
        return null;
      }
    })();
  }

  return modulePromise;
};

const getStorage = async (key: string): Promise<StorageResult> => {
  const module = await loadConsentModule();

  if (!module || !module.navLocalStorage) {
    return {
      storage: null,
      allowed: false,
    };
  }

  const { navLocalStorage, isStorageKeyAllowed } = module;

  const allowed = typeof isStorageKeyAllowed === "function"
    ? Boolean(isStorageKeyAllowed(key))
    : true;

  if (!allowed) {
    return {
      storage: null,
      allowed: false,
    };
  }

  return {
    storage: navLocalStorage,
    allowed: true,
  };
};

export const readConsentValue = async (key: string): Promise<string | null> => {
  const { storage, allowed } = await getStorage(key);
  if (storage) {
    try {
      return storage.getItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console -- development diagnostics only
        console.warn("FlexJar: failed to read consent storage", error);
      }
    }
  }

  return allowed ? null : memoryFallback.get(key) ?? null;
};

export const writeConsentValue = async (key: string, value: string): Promise<WriteResult> => {
  const { storage, allowed } = await getStorage(key);

  if (storage) {
    try {
      storage.setItem(key, value);
      return { persisted: true, allowed: true };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console -- development diagnostics only
        console.warn("FlexJar: failed to write consent storage", error);
      }
      return { persisted: false, allowed: true, error };
    }
  }

  memoryFallback.set(key, value);
  return { persisted: false, allowed };
};

export const removeConsentValue = async (key: string): Promise<void> => {
  const { storage } = await getStorage(key);
  if (storage) {
    try {
      storage.removeItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console -- development diagnostics only
        console.warn("FlexJar: failed to remove consent storage", error);
      }
    }
  }

  memoryFallback.delete(key);
};

export type { WriteResult };
