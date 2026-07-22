export interface UserPreset {
  id: string;
  name: string;
  systemPrompt: string;
  promptTemplate: string;
  isFavorite?: boolean;
}

export interface PresetExportPayload {
  version: string;
  type: "promptlab_presets_export";
  exportedAt: string;
  exportType: "all" | "favorites" | "selected";
  itemCount: number;
  presets: UserPreset[];
}

/**
 * Export user presets to a JSON file.
 */
export function exportPresetsToJSON(
  customPresets: UserPreset[],
  exportType: "all" | "favorites" | "selected",
  activePreset?: UserPreset | null,
  pinnedPresetIds: string[] = []
): { count: number; filename: string } {
  let presetsToExport: UserPreset[] = [];

  // Reconcile isFavorite status with pinnedPresetIds
  const enrichedPresets = customPresets.map((preset) => ({
    ...preset,
    isFavorite: Boolean(preset.isFavorite || pinnedPresetIds.includes(preset.id)),
  }));

  if (exportType === "all") {
    presetsToExport = enrichedPresets;
  } else if (exportType === "favorites") {
    presetsToExport = enrichedPresets.filter((p) => p.isFavorite);
  } else if (exportType === "selected") {
    if (activePreset) {
      const isFav = Boolean(activePreset.isFavorite || pinnedPresetIds.includes(activePreset.id));
      presetsToExport = [{ ...activePreset, isFavorite: isFav }];
    } else {
      presetsToExport = [];
    }
  }

  if (presetsToExport.length === 0) {
    if (exportType === "favorites") {
      throw new Error("No favorite user presets found to export.");
    } else if (exportType === "selected") {
      throw new Error("No active or selected user preset is currently loaded.");
    } else {
      throw new Error("No user presets available to export.");
    }
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);
  const filename = `promptlab_presets_${exportType}_${dateStr}_${timeStr}_${uniqueId}.json`;

  const payload: PresetExportPayload = {
    version: "1.0",
    type: "promptlab_presets_export",
    exportedAt: now.toISOString(),
    exportType,
    itemCount: presetsToExport.length,
    presets: presetsToExport,
  };

  const dataStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { count: presetsToExport.length, filename };
}

/**
 * Import user presets from JSON text with duplicate detection.
 */
export function importPresetsFromJSON(
  jsonText: string,
  currentPresets: UserPreset[],
  pinnedPresetIds: string[] = []
): {
  updatedPresets: UserPreset[];
  newPinnedIds: string[];
  importedCount: number;
  skippedCount: number;
} {
  let parsedData: any;
  try {
    parsedData = JSON.parse(jsonText);
  } catch (err) {
    throw new Error("Invalid JSON file format. Could not parse JSON.");
  }

  let rawItems: any[] = [];
  if (Array.isArray(parsedData)) {
    rawItems = parsedData;
  } else if (parsedData && Array.isArray(parsedData.presets)) {
    rawItems = parsedData.presets;
  } else if (parsedData && Array.isArray(parsedData.items)) {
    rawItems = parsedData.items;
  } else if (
    parsedData &&
    typeof parsedData === "object" &&
    (parsedData.systemPrompt !== undefined || parsedData.promptTemplate !== undefined)
  ) {
    rawItems = [parsedData];
  } else {
    throw new Error("Invalid preset import format. No valid preset items found.");
  }

  if (rawItems.length === 0) {
    throw new Error("The imported file contains no preset records.");
  }

  const now = Date.now();
  const processedNewPresets: UserPreset[] = [];
  const newPinnedIds: string[] = [];
  let skippedCount = 0;

  // Set of existing duplicate checks
  const existingIds = new Set(currentPresets.map((p) => p.id));

  // Helper to test if a raw item is a duplicate of existing or already processed presets
  const isDuplicate = (item: any, existingList: UserPreset[]): boolean => {
    const rawId = item.id;
    if (rawId && existingIds.has(rawId)) {
      return true;
    }

    const rawName = String(item.name || "").trim().toLowerCase();
    const rawSys = String(item.systemPrompt || "");
    const rawTpl = String(item.promptTemplate || "");

    return existingList.some((p) => {
      const existingName = p.name.trim().toLowerCase();
      // Match if same name AND identical prompts
      if (rawName && existingName === rawName && p.systemPrompt === rawSys && p.promptTemplate === rawTpl) {
        return true;
      }
      return false;
    });
  };

  const combinedListForCheck = [...currentPresets];

  rawItems.forEach((rawItem, idx) => {
    const systemPrompt = String(rawItem.systemPrompt || "");
    const promptTemplate = String(rawItem.promptTemplate || "");

    if (!systemPrompt && !promptTemplate) {
      skippedCount++;
      return;
    }

    if (isDuplicate(rawItem, combinedListForCheck)) {
      skippedCount++;
      return;
    }

    const isFav = Boolean(rawItem.isFavorite ?? rawItem.isPinned);
    const newId = rawItem.id && !existingIds.has(rawItem.id)
      ? rawItem.id
      : `custom-preset-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`;

    const newPreset: UserPreset = {
      id: newId,
      name: String(rawItem.name || "Imported Preset").trim(),
      systemPrompt,
      promptTemplate,
      isFavorite: isFav,
    };

    if (isFav) {
      newPinnedIds.push(newId);
    }

    processedNewPresets.push(newPreset);
    combinedListForCheck.push(newPreset);
    existingIds.add(newId);
  });

  const updatedPresets = [...currentPresets, ...processedNewPresets];

  return {
    updatedPresets,
    newPinnedIds,
    importedCount: processedNewPresets.length,
    skippedCount,
  };
}
