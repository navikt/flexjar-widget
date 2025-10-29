declare module "@navikt/nav-dekoratoren-moduler" {
  export function awaitDecoratorData(): Promise<void>;
  export function isStorageKeyAllowed(key: string): boolean;
  export function getCurrentConsent(): Promise<{
    surveys?: boolean;
    statistics?: boolean;
  }>;
  export const navLocalStorage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  } | undefined;
}
