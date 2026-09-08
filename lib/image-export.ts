"use client";

import { toPng } from "html-to-image";

export interface ExportPngOptions {
  /** Project name or slug for the filename */
  projectName?: string;
  /** Active view mode tag, e.g. "auteur", "markdown", "json", "raw" */
  viewMode?: string;
  /** Pixel ratio for retina sharpness (default: 2) */
  pixelRatio?: number;
  /** Background color for the canvas (default: "#FFFFFF") */
  backgroundColor?: string;
  /** Extra padding around the captured element in pixels (default: 20) */
  padding?: number;
}

/**
 * Sanitizes a string into a clean filename-friendly slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

/**
 * Generates a standardized screenshot filename following PromptLab conventions:
 * screenshot_promptlab_{projectSlug}_{viewMode}_{YYYY-MM-DD}_{HHMMSS}_{uniqueId}.png
 */
export function generateScreenshotFilename(
  projectName?: string,
  viewMode = "output"
): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);

  const cleanProject = projectName ? slugify(projectName) : "";
  const cleanView = slugify(viewMode) || "output";

  if (cleanProject && cleanProject !== "default" && cleanProject !== "main_workspace") {
    return `screenshot_promptlab_${cleanProject}_${cleanView}_${dateStr}_${timeStr}_${uniqueId}.png`;
  }

  return `screenshot_promptlab_${cleanView}_${dateStr}_${timeStr}_${uniqueId}.png`;
}

/**
 * Captures an HTML element at full unconstrained scroll height and downloads it as an uncompressed PNG.
 *
 * @param element The HTML element to capture (e.g. the rendered output preview wrapper)
 * @param options Export options including projectName, viewMode, pixelRatio, and backgroundColor
 * @returns Promise that resolves when download is initiated
 */
export async function exportElementToPng(
  element: HTMLElement,
  options: ExportPngOptions = {}
): Promise<{ success: boolean; filename: string }> {
  if (typeof window === "undefined" || !element) {
    throw new Error("Cannot export element: browser window or target element is not available.");
  }

  const {
    projectName,
    viewMode = "output",
    pixelRatio = 2,
    backgroundColor = "#FFFFFF",
    padding = 24,
  } = options;

  const filename = generateScreenshotFilename(projectName, viewMode);

  // Measure true unconstrained dimensions
  const scrollHeight = element.scrollHeight || element.clientHeight;
  const scrollWidth = element.scrollWidth || element.clientWidth;

  // Render to high-DPI PNG data URL
  const dataUrl = await toPng(element, {
    pixelRatio,
    backgroundColor,
    width: scrollWidth + padding * 2,
    height: scrollHeight + padding * 2,
    style: {
      height: "auto",
      maxHeight: "none",
      overflow: "visible",
      padding: `${padding}px`,
      backgroundColor,
    },
    // Preserve fonts and skip potential cross-origin font fetch blocks
    cacheBust: false,
  });

  // Programmatically trigger download
  const downloadLink = document.createElement("a");
  downloadLink.href = dataUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  return { success: true, filename };
}
