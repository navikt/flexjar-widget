import React from "react";
import { BodyLong, Heading, VStack } from "@navikt/ds-react";

interface SuccessContentProps {
  title: string;
  body: React.ReactNode;
}

export const SuccessContent = ({ title, body }: SuccessContentProps) => (
  <VStack gap="3" role="status" aria-live="polite">
    <Heading level="2" size="small">
      {title}
    </Heading>
    {body && <BodyLong>{body}</BodyLong>}
  </VStack>
);
