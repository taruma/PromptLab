"use client";

import { useEffect, useRef } from "react";

type ModalCloseHandler = () => void;

// Module-level global LIFO stack of active modal dismissal handlers
const modalStack: ModalCloseHandler[] = [];

// Register single global Escape listener on window
if (typeof window !== "undefined") {
  window.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalStack.length > 0) {
        // Prevent default browser escape actions and stop propagation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Pop and execute strictly the topmost modal handler
        const topHandler = modalStack.pop();
        if (topHandler) {
          topHandler();
        }
      }
    },
    // Use bubble phase so element and document level listeners (dropdowns, popovers, inputs) can handle Escape first
    false
  );
}

/**
 * Hook to register a modal with the global LIFO Escape key stack.
 * Ensures pressing Escape closes only the topmost active modal/overlay.
 *
 * @param isOpen Whether the modal is currently open
 * @param onClose Callback to invoke when Escape is pressed while this modal is topmost
 * @param enabled Optional flag to conditionally disable escape handling (e.g. while uploading)
 */
export function useModalEscape(
  isOpen: boolean,
  onClose: () => void,
  enabled: boolean = true
) {
  const onCloseRef = useRef(onClose);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    enabledRef.current = enabled;
  });

  useEffect(() => {
    if (!isOpen || !enabled) return;

    const handler: ModalCloseHandler = () => {
      if (enabledRef.current) {
        onCloseRef.current();
      }
    };

    modalStack.push(handler);

    return () => {
      const idx = modalStack.indexOf(handler);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }
    };
  }, [isOpen, enabled]);
}

/**
 * Utility to inspect current modal stack depth (useful for diagnostics & debugging).
 */
export function getModalStackDepth(): number {
  return modalStack.length;
}
