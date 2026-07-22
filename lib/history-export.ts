import { getStoredImage, saveStoredImage } from "./indexeddb";

export interface HistoryImageRef {
  id?: string;
  label: string;
  base64: string;
  mimeType: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  variables: Record<string, string>;
  images: HistoryImageRef[];
  output: string;
  filledPrompt: string;
  promptTemplate?: string;
  systemPrompt?: string;
  presetLabel?: string;
  name?: string;
  model?: string;
  thinkingLevel?: string;
  temperature?: number;
  maxTokens?: string;
  isFavorite?: boolean;
}

export interface HistoryExportPayload {
  version: string;
  type: "promptlab_history_export";
  exportedAt: string;
  exportType: "all" | "favorites" | "selected";
  itemCount: number;
  items: HistoryItem[];
}

/**
  Export history items to a JSON file containing embedded Base64 image data.
 */
export async function exportHistoryToJSON(
  history: HistoryItem[],
  exportType: "all" | "favorites" | "selected",
  selectedItem?: HistoryItem | null
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

  // Resolve Base64 image data for all items from IndexedDB if not already embedded
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
              console.error(`Failed to fetch image ${img.id} for export:`, err);
            }
          }
          return {
            id: img.id,
            label: img.label,
            base64: b64,
            mimeType: img.mimeType || "image/jpeg",
          };
        })
      );

      return {
        ...item,
        images: preparedImages,
      };
    })
  );

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);
  const filename = `promptlab_history_${exportType}_${dateStr}_${timeStr}_${uniqueId}.json`;

  const payload: HistoryExportPayload = {
    version: "1.0",
    type: "promptlab_history_export",
    exportedAt: new Date().toISOString(),
    exportType,
    itemCount: preparedItems.length,
    items: preparedItems,
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

  return { count: preparedItems.length, filename };
}

/**
  Import history items from JSON text, persisting images into IndexedDB.
 */
export async function importHistoryFromJSON(
  jsonText: string,
  currentHistory: HistoryItem[]
): Promise<{ updatedHistory: HistoryItem[]; importedCount: number }> {
  let parsedData: any;
  try {
    parsedData = JSON.parse(jsonText);
  } catch (err) {
    throw new Error("Invalid JSON file format. Could not parse JSON.");
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

  const now = Date.now();
  const processedImportedItems: HistoryItem[] = await Promise.all(
    rawItems.map(async (rawItem, idx) => {
      const newHistoryId = `hist-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      
      const images: HistoryImageRef[] = [];
      if (Array.isArray(rawItem.images)) {
        for (let i = 0; i < rawItem.images.length; i++) {
          const rawImg = rawItem.images[i];
          const newImgId = `hist-img-${now}-${idx}-${i}-${Math.random().toString(36).substring(2, 6)}`;
          
          let base64 = rawImg.base64 || "";
          if (base64) {
            try {
              await saveStoredImage(newImgId, base64);
            } catch (err) {
              console.error("Failed to save imported image to IndexedDB:", err);
            }
          }

          images.push({
            id: newImgId,
            label: rawImg.label || `Image ${i + 1}`,
            base64: "", // Keep base64 empty in local storage to prevent quota limits
            mimeType: rawImg.mimeType || "image/jpeg",
          });
        }
      }

      const item: HistoryItem = {
        id: newHistoryId,
        timestamp: rawItem.timestamp || new Date().toLocaleString(),
        variables: typeof rawItem.variables === "object" && rawItem.variables ? rawItem.variables : {},
        images,
        output: String(rawItem.output || ""),
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
      };

      return item;
    })
  );

  const updatedHistory = [...processedImportedItems, ...currentHistory];
  return { updatedHistory, importedCount: processedImportedItems.length };
}
