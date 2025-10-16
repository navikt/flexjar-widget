import React from "react";
import { BodyLong, Heading, VStack } from "@navikt/ds-react";

interface SuccessContentProps {
  title: string;
  body: React.ReactNode;
  showTitle?: boolean;
  announce?: boolean;
}

export const SuccessContent = ({
  title,
  body,
  showTitle = true,
  announce = true,
}: SuccessContentProps) => {
  const accessibilityProps = announce
    ? { role: "status" as const, "aria-live": "polite" as const }
    : {};

  return (
    <VStack gap="3" {...accessibilityProps}>
      {showTitle && (
        <Heading level="2" size="small">
          {title}
        </Heading>
      )}
      {body && <BodyLong>{body}</BodyLong>}
    </VStack>
  );
};
