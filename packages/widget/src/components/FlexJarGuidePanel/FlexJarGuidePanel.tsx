import React, { useCallback, useState } from "react";
import {
  BodyLong,
  Button,
  GuidePanel,
  HStack,
} from "@navikt/ds-react";
import type { ButtonProps, GuidePanelProps } from "@navikt/ds-react";
import { FlexJarModal } from "../FlexJarModal/FlexJarModal.js";
import type { FlexJarModalProps } from "../FlexJarModal/FlexJarModal.js";

export interface FlexJarGuidePanelProps
  extends Omit<FlexJarModalProps, "open" | "onClose"> {
  panelBody: React.ReactNode;
  buttonLabel?: string;
  buttonProps?: Omit<ButtonProps, "onClick">;
  panelProps?: Omit<GuidePanelProps, "children">;
}

const DEFAULT_BUTTON_LABEL = "\u00c5pne sp\u00f8rreskjema";

export const FlexJarGuidePanel = (
  props: FlexJarGuidePanelProps,
): JSX.Element => {
  const {
    panelBody,
    buttonLabel = DEFAULT_BUTTON_LABEL,
    buttonProps,
    panelProps,
    ...modalProps
  } = props;

  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const bodyContent =
    typeof panelBody === "string" ? <BodyLong>{panelBody}</BodyLong> : panelBody;

  return (
    <>
  <GuidePanel {...panelProps}>
        <HStack gap="4" align="center" wrap>
          {bodyContent}
          <Button
            type="button"
            onClick={handleOpen}
            aria-haspopup="dialog"
            aria-expanded={open}
            {...buttonProps}
          >
            {buttonLabel}
          </Button>
        </HStack>
      </GuidePanel>
      <FlexJarModal {...modalProps} open={open} onClose={handleClose} />
    </>
  );
};
