"use client";

import { useEffect, useRef } from "react";

export interface UseGenerateShortcutOptions {
  /**
   * Callback invoked when Ctrl+Enter or Cmd+Enter is pressed.
   */
  onGenerate: () => void;

  /**
   * Whether the shortcut listener is active.
   * Typically disabled when generation is already in progress or when any modal/dialog is open.
   */
  isEnabled?: boolean;
}

/**
 * Hook to listen for global keyboard shortcuts (Ctrl+Enter / Cmd+Enter) to trigger generation.
 *
 * Behavior:
 * - Listens for Ctrl+Enter (Windows/Linux) or Cmd+Enter (macOS).
 * - Prevents default behavior (e.preventDefault()) so textareas do not insert unwanted newline characters.
 * - Uses a ref to ensure the latest callback closure is always executed without re-attaching event listeners.
 * - Respects the `isEnabled` flag to bypass handling during loading or when modal overlays are active.
 */
export function useGenerateShortcut({
  onGenerate,
  isEnabled = true,
}: UseGenerateShortcutOptions) {
  const onGenerateRef = useRef(onGenerate);

  useEffect(() => {
    onGenerateRef.current = onGenerate;
  }, [onGenerate]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Enter key combined with either Ctrl (Windows/Linux) or Command (macOS)
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onGenerateRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEnabled]);
}
