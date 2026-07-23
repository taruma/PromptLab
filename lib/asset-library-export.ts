import { saveStoredImage, deleteStoredImage } from "./indexeddb";

export interface AssetExportItem {
  id: string;
  label: string;
  base64: string;
  mimeType: string;
  createdAt?: number;
}

export interface AssetLibraryExportData {
  version: "1.0";
  exportDate: string;
  type: "promptlab_asset_library";
  assets: AssetExportItem[];
}

export interface AssetImportParseResult {
  success: boolean;
  data?: AssetLibraryExportData;
  error?: string;
}

/**
 * Downloads asset library items as a JSON file with full timestamp, time, and unique identifier.
 */
export function exportAssetLibraryJSON(
  assets: AssetExportItem[],
  exportType: "all" | "selected" = "all",
  customFilename?: string
): { count: number; filename: string } {
  if (!assets || assets.length === 0) {
    throw new Error("No assets available to export.");
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);

  const filename =
    customFilename ||
    `promptlab_asset_library_${exportType}_${dateStr}_${timeStr}_${uniqueId}.json`;

  const exportPayload: AssetLibraryExportData = {
    version: "1.0",
    exportDate: now.toISOString(),
    type: "promptlab_asset_library",
    assets,
  };

  // Compacted JSON serialization without whitespace to optimize Base64 file size
  const jsonString = JSON.stringify(exportPayload);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { count: assets.length, filename };
}

/**
 * Reads and validates a JSON file containing asset library exports.
 */
export async function readAndValidateAssetLibraryJSON(
  file: File
): Promise<AssetImportParseResult> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Validate structure
    let assetList: any[] = [];

    if (
      parsed &&
      parsed.type === "promptlab_asset_library" &&
      Array.isArray(parsed.assets)
    ) {
      assetList = parsed.assets;
    } else if (Array.isArray(parsed)) {
      // Direct array fallback
      assetList = parsed;
    } else {
      return {
        success: false,
        error:
          "Invalid file format. The JSON file must be a valid PromptLab Asset Library export.",
      };
    }

    const validAssets: AssetExportItem[] = [];

    for (let i = 0; i < assetList.length; i++) {
      const item = assetList[i];
      if (!item || typeof item !== "object") continue;

      const base64 = item.base64 || item.data || item.url || "";
      const label = item.label || item.name || `Asset ${i + 1}`;
      const mimeType = item.mimeType || "image/jpeg";
      const createdAt = item.createdAt || Date.now();
      const id =
        item.id ||
        `lib-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

      if (base64 && typeof base64 === "string" && base64.startsWith("data:image/")) {
        validAssets.push({
          id,
          label: String(label),
          base64,
          mimeType,
          createdAt: typeof createdAt === "number" ? createdAt : Date.now(),
        });
      }
    }

    if (validAssets.length === 0) {
      return {
        success: false,
        error:
          "No valid image assets found in the imported file. Ensure images contain base64 data.",
      };
    }

    return {
      success: true,
      data: {
        version: "1.0",
        exportDate: parsed.exportDate || new Date().toISOString(),
        type: "promptlab_asset_library",
        assets: validAssets,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to parse JSON file.",
    };
  }
}

/**
 * Imports validated assets into the system (IndexedDB + state returned).
 */
export async function processAssetImport(
  importedAssets: AssetExportItem[],
  mode: "merge" | "overwrite",
  existingAssets: AssetExportItem[]
): Promise<{ newAssets: AssetExportItem[]; count: number }> {
  if (mode === "overwrite") {
    // Delete all existing assets from IndexedDB
    for (const existing of existingAssets) {
      try {
        await deleteStoredImage(existing.id);
      } catch (err) {
        console.warn(`Failed to delete asset ${existing.id} during overwrite:`, err);
      }
    }

    // Save all new assets to IndexedDB
    const savedAssets: AssetExportItem[] = [];
    for (let i = 0; i < importedAssets.length; i++) {
      const asset = importedAssets[i];
      const freshId = `lib-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const newAsset = { ...asset, id: freshId };
      await saveStoredImage(freshId, newAsset.base64);
      savedAssets.push(newAsset);
    }

    return { newAssets: savedAssets, count: savedAssets.length };
  } else {
    // Merge mode
    const existingBase64Set = new Set(existingAssets.map((a) => a.base64));
    const mergedList = [...existingAssets];
    let importedCount = 0;

    for (let i = 0; i < importedAssets.length; i++) {
      const asset = importedAssets[i];

      // Skip exact duplicate images
      if (existingBase64Set.has(asset.base64)) {
        continue;
      }

      const freshId = `lib-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const newAsset = { ...asset, id: freshId };
      await saveStoredImage(freshId, newAsset.base64);
      mergedList.unshift(newAsset);
      existingBase64Set.add(newAsset.base64);
      importedCount++;
    }

    return { newAssets: mergedList, count: importedCount };
  }
}
