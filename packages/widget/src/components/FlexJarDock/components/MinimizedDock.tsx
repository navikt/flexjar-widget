import React from "react";
import { Button } from "@navikt/ds-react";
import { ChatIcon } from "@navikt/aksel-icons";

interface MinimizedDockProps {
  label: string;
  panelId: string;
  onReopen: () => void;
  className: string;
}

export const MinimizedDock = ({
  label,
  panelId,
  onReopen,
  className,
}: MinimizedDockProps) => {
  return (
    <Button
      type="button"
      variant="primary"
      size="medium"
      icon={<ChatIcon aria-hidden />}
      onClick={onReopen}
      className={className}
      aria-controls={panelId}
      aria-expanded={false}
    >
      {label}
    </Button>
  );
};

MinimizedDock.displayName = "FlexJarDockMinimized";
