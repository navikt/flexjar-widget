import React from "react";
import { Button } from "@navikt/ds-react";
import { CLASS_NAMES } from "../classNames.js";

interface CloseButtonProps {
  onClose: () => void;
  cancelLabel: string;
}

export const CloseButton = ({ onClose, cancelLabel }: CloseButtonProps) => {
  return (
    <Button
      variant="tertiary"
      size="small"
      onClick={onClose}
      className={CLASS_NAMES.closeButton}
      type="button"
      aria-label={cancelLabel}
      title={cancelLabel}
    >
      <span aria-hidden>✕</span>
    </Button>
  );
};
