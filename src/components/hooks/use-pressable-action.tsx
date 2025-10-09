import { HOLD_TO_CANCEL_THRESHOLD_MS } from "@/lib/card-mapping";
import { isEventTargetInput } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type UsePressableActionOptions = {
  /** The keyboard key that triggers this action */
  key: string;
  /** Callback fired when the action is confirmed (released before threshold) */
  onAction: () => void;
  /** Time in ms before a press is considered "cancelled" */
  holdToCancelThreshold?: number;
  /** Whether the pressable action is enabled */
  enabled?: boolean;
};

type UsePressableActionReturn = {
  /** Current pressed state: true (pressed), false (released), undefined (initial/mouse interaction) */
  pressed: boolean | undefined;
  /** Ref to attach to the interactive element */
  elementRef: React.RefObject<HTMLElement>;
  /** Props to spread onto your button/interactive element */
  pressableProps: {
    onMouseDown: () => void;
    onClick: () => void;
  };
};

export function usePressableAction({
  key,
  onAction,
  holdToCancelThreshold = HOLD_TO_CANCEL_THRESHOLD_MS,
  enabled = true,
}: UsePressableActionOptions): UsePressableActionReturn {
  const elementRef = useRef<HTMLElement>(null);
  const [pressed, setPressed] = useState<boolean | undefined>(undefined);
  const timePressedRef = useRef(0);

  // Handle keyboard press
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEventTargetInput(e)) return;
      if (e.repeat) return;
      if (e.key === key) {
        setPressed(true);
        timePressedRef.current = Date.now();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, enabled]);

  // Handle keyboard release
  useEffect(() => {
    if (!enabled) return;

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isEventTargetInput(e)) return;
      if (e.key === key) {
        const pressDuration = Date.now() - timePressedRef.current;

        if (pressDuration < holdToCancelThreshold) {
          onAction();
        }

        setPressed(false);
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [key, onAction, holdToCancelThreshold, enabled]);

  return {
    pressed,
    elementRef,
    pressableProps: {
      onMouseDown: () => setPressed(undefined),
      onClick: onAction,
    },
  };
}
