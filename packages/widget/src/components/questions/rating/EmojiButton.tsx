import React, { type KeyboardEvent, type ReactNode } from "react";
import { BodyShort } from "@navikt/ds-react";

export interface EmojiButtonProps {
  feedback: number;
  activeState: number | null;
  setActiveState: (state: number) => void;
  children: ReactNode;
  text: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  ariaLabel?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  renderText?: boolean;
}

export const EmojiButton = React.forwardRef<HTMLButtonElement, EmojiButtonProps>(
  (
    {
      feedback,
      activeState,
      setActiveState,
      children,
      text,
      className,
      style,
      disabled,
      ariaLabel,
      onKeyDown,
      renderText = true,
    },
    ref,
  ) => {
    const isActive = activeState === feedback;

    return (
      <button
        ref={ref}
        type="button"
        className={className}
        onClick={() => setActiveState(feedback)}
        aria-pressed={isActive}
        aria-checked={isActive}
        role="radio"
        aria-label={ariaLabel ?? text}
        disabled={disabled}
        style={style}
        onKeyDown={onKeyDown}
      >
        {children}
        {renderText && <BodyShort>{text}</BodyShort>}
      </button>
    );
  },
);

EmojiButton.displayName = "EmojiButton";
