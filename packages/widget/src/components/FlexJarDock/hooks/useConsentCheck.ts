import { useEffect, useState } from "react";

/**
 * Checks if the user has given consent for surveys via nav-dekoratoren.
 * Returns null while checking, true if consent given, false if denied/not answered.
 */
export const useConsentCheck = (): boolean | null => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConsent = async () => {
      if (typeof window === "undefined") {
        setHasConsent(false);
        return;
      }

      try {
        const mod = await import("@navikt/nav-dekoratoren-moduler");
        
        if (typeof mod.getCurrentConsent !== "function") {
          // If getCurrentConsent is not available, assume no consent
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn(
              "[FlexJar] getCurrentConsent not available - widget will not render. " +
              "Ensure @navikt/nav-dekoratoren-moduler >= 1.6.0 is installed."
            );
          }
          setHasConsent(false);
          return;
        }

        const consent = await mod.getCurrentConsent();
        
        // Only render if user has explicitly given surveys consent
        const surveysConsent = consent?.surveys === true;
        
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log(
            `[FlexJar] Surveys consent: ${surveysConsent ? "granted" : "not granted"}`,
            consent
          );
        }
        
        setHasConsent(surveysConsent);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(
            "[FlexJar] Failed to check consent - widget will not render",
            error
          );
        }
        setHasConsent(false);
      }
    };

    void checkConsent();

    // Listen for consent changes (for Storybook mock controls)
    const handleConsentChange = () => {
      void checkConsent();
    };

    window.addEventListener('__flexjar_consent_change__', handleConsentChange);

    return () => {
      window.removeEventListener('__flexjar_consent_change__', handleConsentChange);
    };
  }, []);

  return hasConsent;
};
