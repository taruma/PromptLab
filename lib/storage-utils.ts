export interface StorageBreakdownItem {
  key: string;
  bytes: number;
  formatted: string;
}

export interface LocalStorageInfo {
  usedBytes: number;
  maxBytes: number;
  percentage: number;
  formattedUsed: string;
  formattedMax: string;
  items: StorageBreakdownItem[];
}

export interface IndexedDbInfo {
  usedBytes: number;
  quotaBytes: number;
  percentage: number;
  formattedUsed: string;
  formattedQuota: string;
}

export interface StorageInfo {
  localStorage: LocalStorageInfo;
  indexedDb: IndexedDbInfo | null;
}

/**
 * Format bytes into readable human format (B, KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Calculate LocalStorage usage, quota, and key breakdown
 */
export function getLocalStorageUsage(): LocalStorageInfo {
  const maxBytes = 5 * 1024 * 1024; // Standard 5MB limit
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      usedBytes: 0,
      maxBytes,
      percentage: 0,
      formattedUsed: "0 B",
      formattedMax: "5.0 MB",
      items: [],
    };
  }

  const items: StorageBreakdownItem[] = [];
  let totalBytes = 0;

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        const val = window.localStorage.getItem(key) || "";
        // UTF-16 characters take 2 bytes each in string storage
        const bytes = (key.length + val.length) * 2;
        totalBytes += bytes;
        items.push({
          key,
          bytes,
          formatted: formatBytes(bytes),
        });
      }
    }
  } catch (e) {
    console.warn("Failed to calculate localStorage size", e);
  }

  // Sort largest to smallest
  items.sort((a, b) => b.bytes - a.bytes);

  const percentage = Math.min(100, Math.round((totalBytes / maxBytes) * 100));

  return {
    usedBytes: totalBytes,
    maxBytes,
    percentage,
    formattedUsed: formatBytes(totalBytes),
    formattedMax: formatBytes(maxBytes),
    items,
  };
}

/**
 * Get overall storage estimate including IndexedDB / Origin Storage
 */
export async function getStorageEstimate(): Promise<StorageInfo> {
  const lsInfo = getLocalStorageUsage();
  let idbInfo: IndexedDbInfo | null = null;

  if (
    typeof navigator !== "undefined" &&
    navigator.storage &&
    typeof navigator.storage.estimate === "function"
  ) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;
      const percentage =
        quotaBytes > 0
          ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100))
          : 0;

      idbInfo = {
        usedBytes,
        quotaBytes,
        percentage,
        formattedUsed: formatBytes(usedBytes),
        formattedQuota: formatBytes(quotaBytes),
      };
    } catch (e) {
      console.warn("Failed to retrieve storage estimate", e);
    }
  }

  return {
    localStorage: lsInfo,
    indexedDb: idbInfo,
  };
}
