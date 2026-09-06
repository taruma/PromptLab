import { getStoredImage, saveStoredImage } from "./indexeddb";
import { computeContentHash } from "./content-hash";
import { HistoryItem, HistoryImage, HistoryVideo } from "../types/history";

export type { HistoryItem, HistoryImage, HistoryVideo };

export interface HistoryImageRef {
  id?: string;
  label: string;
  base64: string;
  mimeType: string;
  isFilesApi?: boolean;
  fileUri?: string;
  expirationTime?: string;
  contentHash?: string;
}

export interface HistoryVideoRef {
  id?: string;
  label: string;
  mimeType?: string;
  duration?: number;
  youtubeUrl?: string;
  isYouTube?: boolean;
  base64?: string;
  isFilesApi?: boolean;
  fileUri?: string;
  expirationTime?: string;
  processingMode?: "STATIC" | "AGENTIC";
}

export interface HistoryExportPayload {
  version: string;
  type: "promptlab_history_export";
  exportedAt: string;
  exportType: "all" | "favorites" | "selected";
  itemCount: number;
  images?: Record<string, string>;
  items: HistoryItem[];
}

export interface HistoryImportResult {
  updatedHistory: HistoryItem[];
  importedCount: number;
  skippedCount: number;
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
 * Export history items to a JSON file containing a deduplicated Base64 image pool (v1.1)
 * and streamed chunked Blob construction to bypass browser string allocation limits.
 */
export async function exportHistoryToJSON(
  history: HistoryItem[],
  exportType: "all" | "favorites" | "selected",
  selectedItem?: HistoryItem | null,
  projectName?: string
): Promise<{ count: number; filename: string }> {
  let itemsToExport: HistoryItem[] = [];

  if (exportType === "all") {
    itemsToExport = history;
  } else if (exportType === "favorites") {
    itemsToExport = history.filter((item) => item.isFavorite);
  } else if (exportType === "selected") {
    itemsToExport = selectedItem ? [selectedItem] : [];
  }

  if (itemsToExport.length === 0) {
    throw new Error("No history items found for the selected export option.");
  }

  // Deduplicated image pool: key (contentHash || id) -> base64 payload
  const uniqueImagePool = new Map<string, string>();

  // Resolve Base64 image data for all items from IndexedDB into the deduplicated pool
  const preparedItems: HistoryItem[] = await Promise.all(
    itemsToExport.map(async (item) => {
      const preparedImages = await Promise.all(
        (item.images || []).map(async (img) => {
          let b64 = img.base64 || "";
          if (!b64 && img.id) {
            try {
              const dbBase64 = await getStoredImage(img.id);
              if (dbBase64) {
                b64 = dbBase64;
              }
            } catch (err) {
              console.warn(`Failed to fetch image ${img.id} for export:`, err);
            }
          }
          const contentHash = img.contentHash || (b64 ? await computeContentHash(b64) : undefined);

          if (b64) {
            const poolKey = contentHash || img.id || `img-${Math.random().toString(36).substring(2, 8)}`;
            if (!uniqueImagePool.has(poolKey)) {
              uniqueImagePool.set(poolKey, b64);
            }
          }

          return {
            id: img.id,
            label: img.label,
            base64: "", // Omit Base64 from individual items to prevent redundant multi-megabyte copies!
            mimeType: img.mimeType || "image/jpeg",
            isFilesApi: img.isFilesApi,
            fileUri: img.fileUri,
            expirationTime: img.expirationTime,
            contentHash,
          };
        })
      );

      return {
        ...item,
        images: preparedImages,
        videos: item.videos || [],
      };
    })
  );

  let featureSpecific = exportType as string;
  if (exportType === "selected" && selectedItem) {
    const itemTitle = selectedItem.name || selectedItem.presetLabel || "item";
    const slugified = itemTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (slugified) {
      featureSpecific = slugified;
    }
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);
  const projectSlug = slugify(projectName);
  const filename = `promptlab_${projectSlug}_history_${featureSpecific}_${dateStr}_${timeStr}_${uniqueId}.json`;

  // Build JSON chunks directly into array parts for Blob construction
  // to prevent V8 RangeError: Invalid string length on large datasets (500+ records)
  const chunks: string[] = [];

  // 1. Header metadata
  chunks.push(
    `{"version":"1.1","type":"promptlab_history_export","exportedAt":${JSON.stringify(
      now.toISOString()
    )},"exportType":${JSON.stringify(exportType)},"itemCount":${preparedItems.length},`
  );

  // 2. Deduplicated images pool
  chunks.push(`"images":{`);
  let imgIndex = 0;
  for (const [key, base64] of uniqueImagePool.entries()) {
    if (imgIndex > 0) chunks.push(",");
    chunks.push(`${JSON.stringify(key)}:${JSON.stringify(base64)}`);
    imgIndex++;
  }
  chunks.push(`},"items":[\n`);

  // 3. History item records
  for (let i = 0; i < preparedItems.length; i++) {
    if (i > 0) chunks.push(",\n");
    chunks.push(JSON.stringify(preparedItems[i]));
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

  return { count: preparedItems.length, filename };
}

/**
 * Import history items from JSON text, persisting images into IndexedDB with
 * pool-first hydration, idempotent duplicate skipping, and non-blocking batching.
 */
export async function importHistoryFromJSON(
  jsonText: string,
  currentHistory: HistoryItem[]
): Promise<HistoryImportResult> {
  let parsedData: any;
  try {
    parsedData = JSON.parse(jsonText);
  } catch (err) {
    throw new Error("Invalid JSON file format. Could not parse JSON.");
  }

  // 1. Defensive type verification for accidental wrong-file uploads
  if (parsedData && typeof parsedData === "object" && !Array.isArray(parsedData)) {
    if (parsedData.type === "promptlab_project") {
      throw new Error(
        "This file is a PromptLab Project backup, not a History export. Please import it via the Project Manager modal."
      );
    }
    if (parsedData.type === "promptlab_asset_library") {
      throw new Error(
        "This file is an Asset Library backup, not a History export. Please import it via the Asset Library sidebar."
      );
    }
  }

  let rawItems: any[] = [];
  if (Array.isArray(parsedData)) {
    rawItems = parsedData;
  } else if (parsedData && Array.isArray(parsedData.items)) {
    rawItems = parsedData.items;
  } else if (parsedData && typeof parsedData === "object" && parsedData.output) {
    rawItems = [parsedData];
  } else {
    throw new Error("Invalid history import file format. No history items found.");
  }

  if (rawItems.length === 0) {
    throw new Error("The imported file contains no history records.");
  }

  // 2. Pre-hydrate the image pool (v1.1 format) into IndexedDB
  const imagePool: Record<string, string> =
    parsedData && typeof parsedData.images === "object" && parsedData.images ? parsedData.images : {};

  // Map poolKey -> stored image ID
  const poolKeyToStoredId = new Map<string, string>();
  const poolKeys = Object.keys(imagePool);

  if (poolKeys.length > 0) {
    const POOL_BATCH_SIZE = 10;
    for (let i = 0; i < poolKeys.length; i += POOL_BATCH_SIZE) {
      const slice = poolKeys.slice(i, i + POOL_BATCH_SIZE);
      await Promise.all(
        slice.map(async (key) => {
          const b64 = imagePool[key];
          if (!b64) return;
          const storedId = `hist-pool-${key.slice(0, 16)}-${Math.random().toString(36).substring(2, 6)}`;
          try {
            // saveStoredImage queries IndexedDB contentHash index first and links dedupRefId if image exists
            await saveStoredImage(storedId, b64, key.length === 64 ? key : undefined);
            poolKeyToStoredId.set(key, storedId);
          } catch (err) {
            console.error(`Failed to hydrate image ${key} from pool:`, err);
          }
        })
      );
      if (i + POOL_BATCH_SIZE < poolKeys.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  // 3. Prepare existing history indexes for idempotent duplicate detection
  const existingIds = new Set<string>();
  const existingSignatures = new Set<string>();

  for (const item of currentHistory) {
    if (item.id) existingIds.add(item.id);
    if (item.timestamp && item.output) {
      existingSignatures.add(
        `${item.timestamp}_${(item.filledPrompt || "").slice(0, 100)}_${item.output.slice(0, 100)}`
      );
    }
  }

  const now = Date.now();
  const processedImportedItems: HistoryItem[] = [];
  let skippedCount = 0;

  // 4. Batched non-blocking import processing of history items
  const ITEM_BATCH_SIZE = 20;
  for (let b = 0; b < rawItems.length; b += ITEM_BATCH_SIZE) {
    const batch = rawItems.slice(b, b + ITEM_BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (rawItem, idxInBatch) => {
        const overallIdx = b + idxInBatch;

        // Idempotent check: Skip if already exists by ID
        if (rawItem.id) {
          if (existingIds.has(rawItem.id)) {
            return null;
          }
        } else if (rawItem.timestamp && rawItem.output) {
          // Fallback check strictly for legacy unkeyed items without an ID
          const sig = `${rawItem.timestamp}_${(rawItem.filledPrompt || rawItem.compiledPrompt || "").slice(0, 100)}_${String(rawItem.output).slice(0, 100)}`;
          if (existingSignatures.has(sig)) {
            return null;
          }
        }

        const historyId =
          rawItem.id || `hist-${now}-${overallIdx}-${Math.random().toString(36).substring(2, 6)}`;

        const images: HistoryImage[] = [];
        if (Array.isArray(rawItem.images)) {
          for (let i = 0; i < rawItem.images.length; i++) {
            const rawImg = rawItem.images[i];
            const newImgId = `hist-img-${now}-${overallIdx}-${i}-${Math.random().toString(36).substring(2, 6)}`;

            // Resolve Base64 from:
            // 1. rawImg.base64 (v1.0 legacy embedded format)
            // 2. imagePool[rawImg.contentHash] (v1.1 pooled format)
            // 3. imagePool[rawImg.id] (v1.1 ID pooled format)
            let base64 = rawImg.base64 || "";
            if (!base64) {
              if (rawImg.contentHash && imagePool[rawImg.contentHash]) {
                base64 = imagePool[rawImg.contentHash];
              } else if (rawImg.id && imagePool[rawImg.id]) {
                base64 = imagePool[rawImg.id];
              }
            }

            // Check if we already pre-hydrated this image from the pool
            const preHydratedId =
              (rawImg.contentHash && poolKeyToStoredId.get(rawImg.contentHash)) ||
              (rawImg.id && poolKeyToStoredId.get(rawImg.id));

            if (base64 && !preHydratedId) {
              try {
                await saveStoredImage(newImgId, base64, rawImg.contentHash);
              } catch (err) {
                console.error("Failed to save imported image to IndexedDB:", err);
              }
            }

            const contentHash = rawImg.contentHash || (base64 ? await computeContentHash(base64) : undefined);

            images.push({
              id: preHydratedId || newImgId,
              label: rawImg.label || `Image ${i + 1}`,
              base64: "", // Keep base64 empty in local storage/memory to prevent quota limits
              mimeType: rawImg.mimeType || "image/jpeg",
              isFilesApi: rawImg.isFilesApi,
              fileUri: rawImg.fileUri,
              expirationTime: rawImg.expirationTime,
              contentHash,
            });
          }
        }

        const videos: HistoryVideo[] = [];
        if (Array.isArray(rawItem.videos)) {
          for (let i = 0; i < rawItem.videos.length; i++) {
            const rawVid = rawItem.videos[i];
            videos.push({
              id: rawVid.id || `hist-vid-${now}-${overallIdx}-${i}`,
              label: rawVid.label || `Video ${i + 1}`,
              mimeType: rawVid.mimeType || (rawVid.youtubeUrl ? "video/youtube" : "video/mp4"),
              duration: rawVid.duration,
              youtubeUrl: rawVid.youtubeUrl,
              isYouTube: rawVid.isYouTube || Boolean(rawVid.youtubeUrl),
              isFilesApi: rawVid.isFilesApi,
              fileUri: rawVid.fileUri,
              expirationTime: rawVid.expirationTime,
              processingMode:
                rawVid.processingMode === "AGENTIC"
                  ? "AGENTIC"
                  : rawVid.processingMode === "STATIC"
                  ? "STATIC"
                  : undefined,
            });
          }
        }

        const {
          id: _rawId,
          timestamp: _ts,
          variables: _vars,
          images: _imgs,
          videos: _vids,
          output: _out,
          thinkingResult: _think,
          filledPrompt: _fp,
          compiledPrompt: _cp,
          promptTemplate: _pt,
          systemPrompt: _sp,
          presetLabel: _pl,
          name: _nm,
          title: _tt,
          model: _md,
          thinkingLevel: _tl,
          temperature: _tp,
          maxTokens: _mt,
          isFavorite: _fav,
          tokenUsage: _tu,
          estimatedCost: _ec,
          ...extraRest
        } = rawItem;

        const item: HistoryItem = {
          ...extraRest,
          id: historyId,
          timestamp: rawItem.timestamp || new Date().toLocaleString(),
          variables: typeof rawItem.variables === "object" && rawItem.variables ? rawItem.variables : {},
          images,
          videos,
          output: String(rawItem.output || ""),
          thinkingResult: rawItem.thinkingResult,
          filledPrompt: String(rawItem.filledPrompt || rawItem.compiledPrompt || ""),
          promptTemplate: rawItem.promptTemplate,
          systemPrompt: rawItem.systemPrompt,
          presetLabel: rawItem.presetLabel,
          name: rawItem.name || rawItem.title,
          model: rawItem.model,
          thinkingLevel: rawItem.thinkingLevel,
          temperature: rawItem.temperature,
          maxTokens: rawItem.maxTokens,
          isFavorite: Boolean(rawItem.isFavorite),
          tokenUsage: rawItem.tokenUsage,
          estimatedCost: rawItem.estimatedCost,
        };

        return item;
      })
    );

    for (const res of batchResults) {
      if (res) {
        processedImportedItems.push(res);
        existingIds.add(res.id);
      } else {
        skippedCount++;
      }
    }

    // Yield to event loop to keep UI responsive
    if (b + ITEM_BATCH_SIZE < rawItems.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const updatedHistory = [...processedImportedItems, ...currentHistory];
  return {
    updatedHistory,
    importedCount: processedImportedItems.length,
    skippedCount,
  };
}
