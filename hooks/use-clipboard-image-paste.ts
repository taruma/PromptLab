"use client";

import { useEffect } from "react";

export interface UseClipboardImagePasteOptions {
  /**
   * Callback invoked when one or more image files are pasted from the clipboard.
   */
  onPasteImages: (files: File[]) => void | Promise<void>;

  /**
   * Whether the clipboard listener is active. Defaults to true.
   * Typically set to false when any modal, dialog, or overlay is open.
   */
  isEnabled?: boolean;

  /**
   * Optional callback run right before images are processed (e.g. to expand the assets UI).
   */
  onBeforePaste?: () => void;
}

/**
 * Hook to listen for global clipboard paste events (Ctrl+V / Cmd+V) and extract image files.
 *
 * Behavior:
 * - If image files are present in the clipboard, prevents default paste behavior and passes the files to `onPasteImages`.
 * - If only plain text/HTML is present, does not intercept the event, allowing standard text pasting into inputs/textareas.
 * - Respects the `isEnabled` flag to bypass handling when modals or overlays are active.
 */
export function useClipboardImagePaste({
  onPasteImages,
  isEnabled = true,
  onBeforePaste,
}: UseClipboardImagePasteOptions) {
  useEffect(() => {
    if (!isEnabled) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const imageFiles: File[] = [];

      // Extract image files from clipboardData.items (standard for screenshots & copied images)
      if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }
      } else if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.startsWith("image/")) {
            imageFiles.push(file);
          }
        }
      }

      // If no image files were detected, allow standard browser behavior (e.g. text paste)
      if (imageFiles.length === 0) return;

      // Prevent default so browser doesn't try to paste binary/filename text
      e.preventDefault();

      if (onBeforePaste) {
        onBeforePaste();
      }

      await onPasteImages(imageFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isEnabled, onPasteImages, onBeforePaste]);
}
