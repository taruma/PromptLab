export interface UserPreset {
  id: string;
  name: string;
  systemPrompt: string;
  promptTemplate: string;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PresetExportPayload {
  version: string;
  type: "promptlab_presets_export";
  exportedAt: string;
  exportType: "all" | "favorites" | "selected";
  itemCount: number;
  presets: UserPreset[];
}

function slugify(str?: string): string {
  if (!str) return "main_workspace";
  const slug = str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "main_workspace";
}

/**
 * Export user presets to a JSON file.
 */
export function exportPresetsToJSON(
  customPresets: UserPreset[],
  exportType: "all" | "favorites" | "selected",
  activePreset?: UserPreset | null,
  pinnedPresetIds: string[] = [],
  projectName?: string
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

  let exportTag: string = exportType;
  if (exportType === "selected" && activePreset && activePreset.name) {
    const slugifiedName = activePreset.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (slugifiedName) {
      exportTag = slugifiedName;
    }
  }

  const projectSlug = slugify(projectName);
  const filename = `promptlab_${projectSlug}_preset_${exportTag}_${dateStr}_${timeStr}_${uniqueId}.json`;

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

export interface ProcessedImportItem {
  preset: UserPreset;
  action: "imported" | "replaced" | "skipped";
  skipReason?: "exact_match" | "content_match_different_id";
}

/**
 * Import user presets from JSON text with duplicate detection and configurable strategy.
 */
export function importPresetsFromJSON(
  jsonText: string,
  currentPresets: UserPreset[],
  pinnedPresetIds: string[] = [],
  options: { importStrategy?: "duplicate" | "replace" } = {}
): {
  updatedPresets: UserPreset[];
  newPinnedIds: string[];
  importedCount: number;
  replacedCount: number;
  skippedCount: number;
  processedItems: ProcessedImportItem[];
} {
  const importStrategy = options.importStrategy || "duplicate";
  const processedItems: ProcessedImportItem[] = [];

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
  } else if (parsedData && parsedData.preset && typeof parsedData.preset === "object") {
    rawItems = [parsedData.preset];
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
  const nowISO = new Date(now).toISOString();

  // Working copy of current presets
  const workingPresets = [...currentPresets];
  const processedNewPresets: UserPreset[] = [];
  const newPinnedIds: string[] = [];

  // Track existing IDs and lowercase Names
  const existingIdMap = new Map<string, UserPreset>();
  const existingNamesSet = new Set<string>();

  currentPresets.forEach((p) => {
    existingIdMap.set(p.id, p);
    if (p.name) {
      existingNamesSet.add(p.name.trim().toLowerCase());
    }
  });

  const getUniquePresetName = (baseName: string, nameSet: Set<string>): string => {
    const trimmed = baseName.trim() || "Imported Preset";
    if (!nameSet.has(trimmed.toLowerCase())) {
      nameSet.add(trimmed.toLowerCase());
      return trimmed;
    }

    let coreName = trimmed;
    let counter = 1;
    const match = trimmed.match(/^(.*?)\s*\((\d+)\)$/);
    if (match) {
      coreName = match[1].trim();
      counter = parseInt(match[2], 10) + 1;
    }

    while (true) {
      const candidate = `${coreName} (${counter})`;
      if (!nameSet.has(candidate.toLowerCase())) {
        nameSet.add(candidate.toLowerCase());
        return candidate;
      }
      counter++;
    }
  };

  let importedCount = 0;
  let replacedCount = 0;
  let skippedCount = 0;

  rawItems.forEach((rawItem, idx) => {
    const systemPrompt = String(rawItem.systemPrompt || "");
    const promptTemplate = String(rawItem.promptTemplate || "");

    if (!systemPrompt && !promptTemplate) {
      skippedCount++;
      return;
    }

    const rawId = rawItem.id ? String(rawItem.id) : null;
    const rawName = String(rawItem.name || "Imported Preset").trim();
    const isFav = Boolean(rawItem.isFavorite ?? rawItem.isPinned);

    // 1. Check if an identical preset already exists (same name AND same systemPrompt AND same promptTemplate)
    const exactMatch = workingPresets.find((p) => {
      const sameName = (p.name || "").trim().toLowerCase() === rawName.toLowerCase();
      const sameSys = (p.systemPrompt || "").trim() === systemPrompt.trim();
      const sameTmpl = (p.promptTemplate || "").trim() === promptTemplate.trim();
      return sameName && sameSys && sameTmpl;
    });

    if (exactMatch) {
      // The preset is completely identical to an existing preset in the library; skip creating a duplicate
      skippedCount++;
      processedItems.push({
        preset: exactMatch,
        action: "skipped",
        skipReason: exactMatch.id === rawId ? "exact_match" : "content_match_different_id",
      });
      return;
    }

    // Check if ID exists in original or updated list
    const existingIndex = rawId ? workingPresets.findIndex((p) => p.id === rawId) : -1;

    if (importStrategy === "replace" && existingIndex !== -1 && rawId) {
      // Overwrite existing preset with matching ID
      const targetPreset = workingPresets[existingIndex];
      const updatedPreset: UserPreset = {
        ...targetPreset,
        name: rawName || targetPreset.name,
        systemPrompt,
        promptTemplate,
        isFavorite: isFav ?? targetPreset.isFavorite,
        updatedAt: nowISO,
      };
      workingPresets[existingIndex] = updatedPreset;
      existingIdMap.set(rawId, updatedPreset);
      replacedCount++;
      processedItems.push({ preset: updatedPreset, action: "replaced" });

      if (isFav) {
        newPinnedIds.push(rawId);
      }
    } else {
      // Duplicate mode (default) OR replace mode for new IDs
      const isIdConflict = Boolean(rawId && existingIdMap.has(rawId));
      const shouldAssignFreshId = (importStrategy === "duplicate" && isIdConflict) || !rawId || isIdConflict;

      const newId = shouldAssignFreshId
        ? `custom-preset-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`
        : rawId;

      // Unique name if duplicate mode with conflict OR name conflict
      const isNameConflict = existingNamesSet.has(rawName.toLowerCase());
      const shouldSuffixName = (importStrategy === "duplicate" && (isIdConflict || isNameConflict)) || isNameConflict;

      const finalName = shouldSuffixName
        ? getUniquePresetName(rawName, existingNamesSet)
        : rawName;

      existingNamesSet.add(finalName.toLowerCase());

      const createdAt = rawItem.createdAt ? String(rawItem.createdAt) : nowISO;
      const updatedAt = rawItem.updatedAt ? String(rawItem.updatedAt) : createdAt;

      const newPreset: UserPreset = {
        id: newId,
        name: finalName,
        systemPrompt,
        promptTemplate,
        isFavorite: isFav,
        createdAt,
        updatedAt,
      };

      if (isFav) {
        newPinnedIds.push(newId);
      }

      processedNewPresets.push(newPreset);
      workingPresets.push(newPreset);
      existingIdMap.set(newId, newPreset);
      importedCount++;
      processedItems.push({ preset: newPreset, action: "imported" });
    }
  });

  return {
    updatedPresets: workingPresets,
    newPinnedIds,
    importedCount,
    replacedCount,
    skippedCount,
    processedItems,
  };
}
