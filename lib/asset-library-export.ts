import { saveStoredImage, deleteStoredImage } from "./indexeddb";
import { computeContentHash } from "./content-hash";

export interface AssetExportItem {
  id: string;
  label: string;
  base64: string;
  mimeType: string;
  createdAt?: number;
  isFavorite?: boolean;
  isPinned?: boolean;
  contentHash?: string;
}

export interface AssetLibraryExportData {
  version: "1.0" | "1.1";
  exportDate: string;
  type: "promptlab_asset_library";
  exportType?: "all" | "favorites" | "selected";
  itemCount?: number;
  images?: Record<string, string>;
  assets: AssetExportItem[];
}

export interface AssetImportParseResult {
  success: boolean;
  data?: AssetLibraryExportData;
  error?: string;
}

export interface AssetImportResult {
  newAssets: AssetExportItem[];
  importedCount: number;
  skippedCount: number;
  replacedCount?: number;
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
 * Downloads asset library items as a JSON file with v1.1 deduplicated image pool
 * and streamed chunked Blob construction to bypass browser string allocation limits.
 */
export async function exportAssetLibraryJSON(
  assets: AssetExportItem[],
  exportType: "all" | "favorites" | "selected" = "all",
  customFilename?: string,
  projectName?: string
): Promise<{ count: number; filename: string }> {
  if (!assets || assets.length === 0) {
    throw new Error("No assets available to export.");
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);
  const projectSlug = slugify(projectName);

  const filename =
    customFilename ||
    `promptlab_${projectSlug}_asset_${exportType}_${dateStr}_${timeStr}_${uniqueId}.json`;

  // Deduplicated image pool: key (contentHash || id) -> base64 payload
  const uniqueImagePool = new Map<string, string>();

  // Prepare assets and populate image pool with contentHash
  const preparedAssets: AssetExportItem[] = await Promise.all(
    assets.map(async (asset) => {
      const b64 = asset.base64 || "";
      const contentHash = asset.contentHash || (b64 ? await computeContentHash(b64) : undefined);

      if (b64) {
        const poolKey = contentHash || asset.id || `lib-pool-${Math.random().toString(36).substring(2, 8)}`;
        if (!uniqueImagePool.has(poolKey)) {
          uniqueImagePool.set(poolKey, b64);
        }
      }

      return {
        id: asset.id,
        label: asset.label,
        base64: "", // Omit Base64 from individual items to prevent redundant duplication in v1.1
        mimeType: asset.mimeType || "image/jpeg",
        createdAt: asset.createdAt || Date.now(),
        isFavorite: asset.isFavorite,
        isPinned: asset.isPinned,
        contentHash,
      };
    })
  );

  // Build JSON chunks directly into array parts for Blob construction
  // to prevent V8 RangeError: Invalid string length on large collections
  const chunks: string[] = [];

  // 1. Header metadata
  chunks.push(
    `{"version":"1.1","type":"promptlab_asset_library","exportDate":${JSON.stringify(
      now.toISOString()
    )},"exportType":${JSON.stringify(exportType)},"itemCount":${preparedAssets.length},`
  );

  // 2. Deduplicated images pool
  chunks.push(`"images":{`);
  let imgIndex = 0;
  for (const [key, base64] of uniqueImagePool.entries()) {
    if (imgIndex > 0) chunks.push(",");
    chunks.push(`${JSON.stringify(key)}:${JSON.stringify(base64)}`);
    imgIndex++;
  }
  chunks.push(`},"assets":[\n`);

  // 3. Asset records
  for (let i = 0; i < preparedAssets.length; i++) {
    if (i > 0) chunks.push(",\n");
    chunks.push(JSON.stringify(preparedAssets[i]));
  }
  chunks.push("\n]}");

  const blob = new Blob(chunks, { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { count: preparedAssets.length, filename };
}

/**
 * Reads and validates a JSON file containing asset library exports with
 * defensive format inspection, v1.1 pool resolution, and contentHash indexing.
 */
export async function readAndValidateAssetLibraryJSON(
  file: File
): Promise<AssetImportParseResult> {
  try {
    const text = await file.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: "Invalid JSON format. Could not parse JSON file.",
      };
    }

    // Defensive check against wrong backup file types
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (parsed.type === "promptlab_project") {
        return {
          success: false,
          error:
            "This file is a PromptLab Project backup, not an Asset Library backup. Please import it via the Project Workspace Manager.",
        };
      }
      if (parsed.type === "promptlab_history_export") {
        return {
          success: false,
          error:
            "This file is a PromptLab History export, not an Asset Library backup. Please import it via the History Explorer.",
        };
      }
      if (parsed.type === "promptlab_user_presets") {
        return {
          success: false,
          error:
            "This file is a PromptLab Presets export, not an Asset Library backup. Please import it via the Prompt Configuration editor.",
        };
      }
    }

    // Validate structure
    let assetList: any[] = [];
    if (
      parsed &&
      parsed.type === "promptlab_asset_library" &&
      Array.isArray(parsed.assets)
    ) {
      assetList = parsed.assets;
    } else if (Array.isArray(parsed)) {
      assetList = parsed;
    } else {
      return {
        success: false,
        error:
          "Invalid file format. The JSON file must be a valid PromptLab Asset Library export.",
      };
    }

    // Extract image pool (v1.1) if present
    const imagePool: Record<string, string> =
      parsed && typeof parsed.images === "object" && parsed.images ? parsed.images : {};

    const validAssets: AssetExportItem[] = [];

    for (let i = 0; i < assetList.length; i++) {
      const item = assetList[i];
      if (!item || typeof item !== "object") continue;

      // Check pool first, then inline base64/data/url
      let base64 = item.base64 || item.data || item.url || "";
      if (!base64 && item.contentHash && imagePool[item.contentHash]) {
        base64 = imagePool[item.contentHash];
      }
      if (!base64 && item.id && imagePool[item.id]) {
        base64 = imagePool[item.id];
      }

      const label = item.label || item.name || `Asset ${i + 1}`;
      const mimeType = item.mimeType || "image/jpeg";
      const createdAt = typeof item.createdAt === "number" ? item.createdAt : Date.now();
      const id =
        item.id ||
        `lib-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

      if (
        base64 &&
        typeof base64 === "string" &&
        (base64.startsWith("data:image/") || base64.length > 50)
      ) {
        const formattedBase64 = base64.startsWith("data:")
          ? base64
          : `data:${mimeType};base64,${base64}`;
        const contentHash = item.contentHash || (await computeContentHash(formattedBase64));

        validAssets.push({
          id,
          label: String(label),
          base64: formattedBase64,
          mimeType,
          createdAt,
          contentHash,
          ...(item.isFavorite !== undefined ? { isFavorite: Boolean(item.isFavorite) } : {}),
          ...(item.isPinned !== undefined ? { isPinned: Boolean(item.isPinned) } : {}),
        });
      }
    }

    if (validAssets.length === 0) {
      return {
        success: false,
        error:
          "No valid image assets found in the imported file. Ensure images contain valid base64 data.",
      };
    }

    return {
      success: true,
      data: {
        version: parsed.version === "1.1" ? "1.1" : "1.0",
        exportDate: parsed.exportDate || new Date().toISOString(),
        type: "promptlab_asset_library",
        assets: validAssets,
        images: imagePool,
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
 * Imports validated assets into the system (IndexedDB + state returned)
 * with hash-based deduplication, pool hydration, and event-loop yielding.
 */
export async function processAssetImport(
  importedAssets: AssetExportItem[],
  mode: "merge" | "overwrite",
  existingAssets: AssetExportItem[]
): Promise<AssetImportResult> {
  const BATCH_SIZE = 10;

  if (mode === "overwrite") {
    // Delete all existing assets from IndexedDB
    for (const existing of existingAssets) {
      try {
        await deleteStoredImage(existing.id);
      } catch (err) {
        console.warn(`Failed to delete asset ${existing.id} during overwrite:`, err);
      }
    }

    // Save all new assets to IndexedDB in non-blocking batches
    const savedAssets: AssetExportItem[] = [];
    for (let i = 0; i < importedAssets.length; i++) {
      const asset = importedAssets[i];
      const freshId = `lib-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const hash = asset.contentHash || (await computeContentHash(asset.base64));
      const newAsset: AssetExportItem = { ...asset, id: freshId, contentHash: hash };

      await saveStoredImage(freshId, newAsset.base64, hash);
      savedAssets.push(newAsset);

      if (i > 0 && i % BATCH_SIZE === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return {
      newAssets: savedAssets,
      importedCount: savedAssets.length,
      skippedCount: 0,
      replacedCount: existingAssets.length,
    };
  } else {
    // Merge mode: deduplicate using SHA-256 contentHash or matching ID
    const existingHashSet = new Set<string>();
    const existingIdSet = new Set(existingAssets.map((a) => a.id).filter(Boolean));

    for (const a of existingAssets) {
      if (a.contentHash) {
        existingHashSet.add(a.contentHash);
      } else if (a.base64) {
        const hash = await computeContentHash(a.base64);
        if (hash) {
          existingHashSet.add(hash);
        }
      }
    }

    const mergedList = [...existingAssets];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < importedAssets.length; i++) {
      const asset = importedAssets[i];
      const hash = asset.contentHash || (await computeContentHash(asset.base64));

      // Skip exact duplicate images based on contentHash OR matching ID
      const isDuplicate =
        (hash && existingHashSet.has(hash)) ||
        (asset.id && existingIdSet.has(asset.id));

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      const freshId = `lib-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const newAsset: AssetExportItem = { ...asset, id: freshId, contentHash: hash };

      await saveStoredImage(freshId, newAsset.base64, hash);
      mergedList.unshift(newAsset);
      if (hash) {
        existingHashSet.add(hash);
      }
      importedCount++;

      if (i > 0 && i % BATCH_SIZE === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return {
      newAssets: mergedList,
      importedCount,
      skippedCount,
    };
  }
}
