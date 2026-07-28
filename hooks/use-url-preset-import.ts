"use client";

import { useState, useEffect } from "react";
import { importPresetsFromJSON, type UserPreset } from "../lib/preset-export";
import { getRawUrl } from "../lib/utils";
import { type UploadedImage } from "../components/VisualAssetsSection";
import { type UploadedVideo } from "../lib/video-utils";

export interface UrlPresetData {
  name: string;
  systemPrompt: string;
  promptTemplate: string;
  url: string;
  rawJsonText?: string;
  importResult?: ReturnType<typeof importPresetsFromJSON>;
  targetPreset?: UserPreset;
}

export const cleanUrlParam = () => {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.delete("presetUrl");
    url.searchParams.delete("configUrl");
    url.searchParams.delete("preset");
    url.searchParams.delete("config");
    url.searchParams.delete("preseturl");
    window.history.replaceState({}, "", url.pathname + url.search);
  }
};

export interface UseUrlPresetImportParams {
  customPresets: UserPreset[];
  pinnedPresetIds: string[];
  setCustomPresets: React.Dispatch<React.SetStateAction<UserPreset[]>>;
  setPinnedPresetIds: React.Dispatch<React.SetStateAction<string[]>>;
  setLoadedPresetId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveEditingPresetId: React.Dispatch<React.SetStateAction<string | null>>;
  setNewPresetName: React.Dispatch<React.SetStateAction<string>>;
  setSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
  setPromptTemplate: React.Dispatch<React.SetStateAction<string>>;
  setVariables: React.Dispatch<React.SetStateAction<string[]>>;
  setInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  setUploadedVideos: React.Dispatch<React.SetStateAction<UploadedVideo[]>>;
  setGenerationResult: React.Dispatch<React.SetStateAction<string>>;
  setFilledPrompt: React.Dispatch<React.SetStateAction<string>>;
  setThinkingResult: React.Dispatch<React.SetStateAction<string>>;
  setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
  extractVariables: (templateText: string) => string[];
}

export function useUrlPresetImport({
  customPresets,
  pinnedPresetIds,
  setCustomPresets,
  setPinnedPresetIds,
  setLoadedPresetId,
  setActiveEditingPresetId,
  setNewPresetName,
  setSystemPrompt,
  setPromptTemplate,
  setVariables,
  setInputs,
  setUploadedImages,
  setUploadedVideos,
  setGenerationResult,
  setFilledPrompt,
  setThinkingResult,
  setIsThinking,
  extractVariables,
}: UseUrlPresetImportParams) {
  const [urlPresetData, setUrlPresetData] = useState<UrlPresetData | null>(null);
  const [isUrlImportConfirmOpen, setIsUrlImportConfirmOpen] = useState<boolean>(false);
  const [urlImportPending, setUrlImportPending] = useState<boolean>(false);
  const [urlImportError, setUrlImportError] = useState<string | null>(null);
  const [urlImportSuccessMsg, setUrlImportSuccessMsg] = useState<string | null>(null);
  const [applyToWorkspace, setApplyToWorkspace] = useState<boolean>(true);

  // Fetch preset from URL query parameter if present on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlParam =
      params.get("presetUrl") ||
      params.get("configUrl") ||
      params.get("preset") ||
      params.get("config") ||
      params.get("preseturl");

    if (urlParam) {
      let targetUrl = decodeURIComponent(urlParam);
      targetUrl = getRawUrl(targetUrl);

      async function fetchPresetFromUrl() {
        setUrlImportPending(true);
        setUrlImportError(null);
        try {
          const res = await fetch(targetUrl);
          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }
          const text = await res.text();

          // Ensure existing custom presets are loaded from state or localStorage
          let existingCustomPresets = customPresets;
          if (existingCustomPresets.length === 0 && typeof window !== "undefined") {
            try {
              const saved = localStorage.getItem("prompt_generator_custom_presets");
              if (saved) existingCustomPresets = JSON.parse(saved);
            } catch (e) {}
          }

          const importResult = importPresetsFromJSON(text, existingCustomPresets, pinnedPresetIds);

          if (importResult.importedCount === 0 && importResult.skippedCount === 0) {
            throw new Error("No valid preset items found in remote file.");
          }

          let targetPreset: UserPreset | null = null;
          if (importResult.importedCount > 0) {
            targetPreset = importResult.updatedPresets[importResult.updatedPresets.length - 1];
          } else {
            try {
              const rawParsed = JSON.parse(text);
              const raw = Array.isArray(rawParsed)
                ? rawParsed[0]
                : rawParsed.presets?.[0] || rawParsed.items?.[0] || rawParsed.preset || rawParsed;
              if (raw) {
                targetPreset =
                  customPresets.find(
                    (p) =>
                      (p.name &&
                        raw.name &&
                        p.name.trim().toLowerCase() === String(raw.name).trim().toLowerCase()) ||
                      (p.systemPrompt === String(raw.systemPrompt || "") &&
                        p.promptTemplate === String(raw.promptTemplate || ""))
                  ) || null;
              }
            } catch (e) {}
            if (!targetPreset && importResult.updatedPresets.length > 0) {
              targetPreset = importResult.updatedPresets[importResult.updatedPresets.length - 1];
            }
          }

          if (targetPreset) {
            setUrlPresetData({
              name: targetPreset.name || "Imported URL Preset",
              systemPrompt: targetPreset.systemPrompt,
              promptTemplate: targetPreset.promptTemplate,
              url: targetUrl,
              rawJsonText: text,
              importResult: importResult,
              targetPreset: targetPreset,
            });
            setIsUrlImportConfirmOpen(true);
          } else {
            throw new Error("Invalid preset format. Could not process preset from URL.");
          }
        } catch (err: any) {
          console.error("Failed to fetch preset from URL:", err);
          setUrlImportError(
            `Failed to load preset from URL: ${err.message}. Ensure the link is valid and the server supports CORS.`
          );
          cleanUrlParam();
        } finally {
          setUrlImportPending(false);
        }
      }

      setTimeout(() => {
        fetchPresetFromUrl();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyUrlPreset = () => {
    if (!urlPresetData) return;

    // Get freshest customPresets from state or localStorage
    let currentPresets = customPresets;
    if (currentPresets.length === 0 && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prompt_generator_custom_presets");
        if (saved) currentPresets = JSON.parse(saved);
      } catch (e) {}
    }

    let freshImportResult = urlPresetData.importResult;
    if (urlPresetData.rawJsonText) {
      try {
        freshImportResult = importPresetsFromJSON(urlPresetData.rawJsonText, currentPresets, pinnedPresetIds);
      } catch (e) {
        console.error("Failed to re-evaluate preset import:", e);
      }
    }

    let importedCount = 0;
    if (freshImportResult) {
      const { updatedPresets, newPinnedIds, importedCount: count } = freshImportResult;
      importedCount = count;

      if (importedCount > 0 || updatedPresets.length > 0) {
        setCustomPresets(updatedPresets);
        try {
          localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(updatedPresets));
        } catch (err) {
          console.error("Failed to save custom presets to localStorage:", err);
        }

        if (newPinnedIds && newPinnedIds.length > 0) {
          const mergedPinned = Array.from(new Set([...pinnedPresetIds, ...newPinnedIds]));
          setPinnedPresetIds(mergedPinned);
          try {
            localStorage.setItem("prompt_generator_pinned_presets", JSON.stringify(mergedPinned));
          } catch (err) {
            console.error("Failed to save pinned presets to localStorage:", err);
          }
        }
      }
    }

    if (applyToWorkspace) {
      const presetToLoad = urlPresetData.targetPreset;
      if (presetToLoad) {
        setLoadedPresetId(presetToLoad.id);
        setActiveEditingPresetId(presetToLoad.id);
        setNewPresetName(presetToLoad.name);
        try {
          localStorage.setItem("prompt_generator_loaded_preset_id", presetToLoad.id);
        } catch (e) {}
      }

      setSystemPrompt(urlPresetData.systemPrompt);
      setPromptTemplate(urlPresetData.promptTemplate);
      const vars = extractVariables(urlPresetData.promptTemplate);
      setVariables(vars);

      try {
        localStorage.setItem("prompt_generator_system_prompt", urlPresetData.systemPrompt);
        localStorage.setItem("prompt_generator_prompt_template", urlPresetData.promptTemplate);
      } catch (e) {}

      setInputs((prev) => {
        const updatedInputs: Record<string, string> = { ...prev };
        vars.forEach((v) => {
          if (v !== "visual_references" && v !== "cast" && v !== "idea") {
            if (updatedInputs[v] === undefined) {
              updatedInputs[v] = "";
            }
          }
        });
        return updatedInputs;
      });
    }

    const appliedNotice = applyToWorkspace ? " & applied to active workspace" : "";
    setUrlImportSuccessMsg(`Successfully imported "${urlPresetData.name}" into library${appliedNotice}.`);
    setTimeout(() => {
      setUrlImportSuccessMsg(null);
    }, 4000);

    setIsUrlImportConfirmOpen(false);
    setUrlPresetData(null);
    cleanUrlParam();
  };

  const handleCancelUrlPreset = () => {
    setIsUrlImportConfirmOpen(false);
    setUrlPresetData(null);
    cleanUrlParam();
  };

  return {
    urlPresetData,
    setUrlPresetData,
    isUrlImportConfirmOpen,
    setIsUrlImportConfirmOpen,
    urlImportPending,
    setUrlImportPending,
    urlImportError,
    setUrlImportError,
    urlImportSuccessMsg,
    setUrlImportSuccessMsg,
    applyToWorkspace,
    setApplyToWorkspace,
    handleApplyUrlPreset,
    handleCancelUrlPreset,
  };
}
