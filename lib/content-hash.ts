import { getStoredImage } from "./indexeddb";

/**
 * Utility to compute SHA-256 content hash for binary/base64 image asset data.
 * Safe, asynchronous, non-blocking, with fallback support.
 */

/**
 * Computes a SHA-256 hex string for base64 or raw string data.
 * @param data Base64 data string (with or without data URL prefix).
 * @returns Promise resolving to hex string (64 chars) or empty string if no data.
 */
export async function computeContentHash(data: string): Promise<string> {
  if (!data) return "";

  // Strip data URL prefix if present so we hash the clean data payload consistently
  const cleanData = data.includes(",") ? data.split(",")[1] : data;
  if (!cleanData) return "";

  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(cleanData);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return hashHex;
    }
  } catch (err) {
    console.warn("Web Crypto SHA-256 failed, using fallback hash:", err);
  }

  // Fallback FNV-1a 64-bit hex hash
  return computeFallbackHash(cleanData);
}

/**
 * Fallback non-cryptographic FNV-1a hash function.
 */
export function computeFallbackHash(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 16777619);
    h2 ^= ch;
    h2 = Math.imul(h2, 16777619);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}${hex2}`;
}

/**
 * Migration & backfill helper: Scans history items and assigns a contentHash
 * to each image entry if missing, safely pulling image base64 from IndexedDB when needed.
 */
export async function ensureHistoryHasContentHashes<T extends { images?: any[] }>(
  historyItems: T[]
): Promise<{ updatedHistory: T[]; modified: boolean }> {
  if (!historyItems || !Array.isArray(historyItems) || historyItems.length === 0) {
    return { updatedHistory: historyItems || [], modified: false };
  }

  let modified = false;

  const updatedHistory = await Promise.all(
    historyItems.map(async (item) => {
      if (!item.images || !Array.isArray(item.images) || item.images.length === 0) {
        return item;
      }

      let itemModified = false;
      const updatedImages = await Promise.all(
        item.images.map(async (img) => {
          if (img.contentHash) {
            return img;
          }

          let b64 = img.base64;
          if (!b64 && img.id) {
            try {
              b64 = await getStoredImage(img.id);
            } catch (err) {
              console.warn(`Could not load image ${img.id} for hashing:`, err);
            }
          }

          if (b64) {
            const hash = await computeContentHash(b64);
            if (hash) {
              itemModified = true;
              return { ...img, contentHash: hash };
            }
          }

          return img;
        })
      );

      if (itemModified) {
        modified = true;
        return { ...item, images: updatedImages };
      }

      return item;
    })
  );

  return { updatedHistory, modified };
}

