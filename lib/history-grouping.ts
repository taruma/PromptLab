/**
 * History Grouping, Sorting, and Multi-Criteria Filtering Helpers
 * Implements robust date parsing, date bucket categorisation, AND-logic media filters,
 * preset & model extractors, and cost/name sorting for PromptLab.
 */

import {
  HistoryItem,
  HistoryFilterState,
  HistorySortOption,
  HistoryMediaType,
  HistorySearchScope,
} from "../types/history";
import { matchesSearchQuery } from "./search-utils";

export type DateBucketKey = "TODAY" | "YESTERDAY" | "PREVIOUS 7 DAYS" | "OLDER";

export const DEFAULT_FILTER_STATE: HistoryFilterState = {
  sortBy: "date_desc",
  searchScope: "all",
  presetFilter: "all",
  modelFilter: "all",
  thinkingFilter: "all",
  mediaFilters: [],
};

/**
 * Parses numeric timestamp from history item ID (gen-timestamp) or string timestamp
 */
export function parseHistoryDate(item: HistoryItem): number {
  if (item.id && item.id.startsWith("gen-")) {
    const rawNum = item.id.slice(4);
    const parsed = parseInt(rawNum, 10);
    if (!isNaN(parsed) && parsed > 1500000000000) {
      return parsed;
    }
  }

  if (!item.timestamp) return 0;

  // Format like "Sep 6, 05:35", "Jul 26, 05:22 AM", "Jul 26, 17:22"
  const regex = /^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i;
  const match = item.timestamp.trim().match(regex);
  if (match) {
    const monthStr = match[1];
    const day = parseInt(match[2], 10);
    let hour = parseInt(match[3], 10);
    const minute = parseInt(match[4], 10);
    const ampm = match[5];

    if (ampm) {
      const upper = ampm.toUpperCase();
      if (upper === "PM" && hour < 12) hour += 12;
      if (upper === "AM" && hour === 12) hour = 0;
    }

    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthIdx = months[monthStr.toLowerCase()];
    if (monthIdx !== undefined) {
      const now = new Date();
      let year = now.getFullYear();
      // If the parsed month is far in the future compared to now, it may have been from previous year
      const candidateDate = new Date(year, monthIdx, day, hour, minute);
      if (candidateDate.getTime() > now.getTime() + 86400000 * 30) {
        year -= 1;
      }
      return new Date(year, monthIdx, day, hour, minute).getTime();
    }
  }

  const directParsed = Date.parse(item.timestamp);
  return isNaN(directParsed) ? 0 : directParsed;
}

/**
 * Assigns a timestamp (epoch ms) to one of the 4 date bucket categories
 */
export function getDateBucket(timestampMs: number): DateBucketKey {
  if (!timestampMs || timestampMs <= 0) return "OLDER";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfSevenDaysAgo = startOfToday - 6 * 86400000;

  if (timestampMs >= startOfToday) {
    return "TODAY";
  }
  if (timestampMs >= startOfYesterday) {
    return "YESTERDAY";
  }
  if (timestampMs >= startOfSevenDaysAgo) {
    return "PREVIOUS 7 DAYS";
  }
  return "OLDER";
}

/**
 * Parse numeric cost value from formatted string (e.g. "$0.00123" -> 0.00123)
 */
export function parseCostNumeric(costStr?: string): number {
  if (!costStr) return 0;
  const cleaned = costStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Media type inspector helpers
export function itemHasImages(item: HistoryItem): boolean {
  return Boolean(item.images && item.images.length > 0);
}

export function itemHasVideos(item: HistoryItem): boolean {
  if (!item.videos || item.videos.length === 0) return false;
  return item.videos.some(
    (v) =>
      !v.mimeType?.startsWith("audio/") &&
      !(v.mimeType?.startsWith("text/") || v.mimeType === "application/pdf")
  );
}

export function itemHasAudios(item: HistoryItem): boolean {
  if (!item.videos || item.videos.length === 0) return false;
  return item.videos.some((v) => Boolean(v.mimeType?.startsWith("audio/")));
}

export function itemHasDocs(item: HistoryItem): boolean {
  if (!item.videos || item.videos.length === 0) return false;
  return item.videos.some(
    (v) =>
      Boolean(v.mimeType?.startsWith("text/")) ||
      v.mimeType === "application/pdf" ||
      (Boolean(v.mimeType) &&
        !v.mimeType?.startsWith("video/") &&
        !v.mimeType?.startsWith("image/") &&
        !v.mimeType?.startsWith("audio/"))
  );
}

export function itemIsTextOnly(item: HistoryItem): boolean {
  return !itemHasImages(item) && (!item.videos || item.videos.length === 0);
}

/**
 * Matches an item against the active search query and scope
 */
export function matchItemSearch(
  item: HistoryItem,
  query: string,
  scope: HistorySearchScope
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  if (scope === "all") {
    const title = item.name || item.variables["idea"] || "Untitled Outline";
    const idea = item.variables["idea"] || "";
    const output = item.output || "";
    const imageLabels = (item.images || []).map((img) => img.label);
    const videoLabels = (item.videos || []).map((vid) => vid.label);
    const filledPrompt = item.filledPrompt || "";
    const paramKeys = Object.keys(item.variables || {});
    const paramValues = Object.values(item.variables || {});

    return matchesSearchQuery(
      [title, idea, output, ...imageLabels, ...videoLabels, filledPrompt, ...paramKeys, ...paramValues],
      trimmed
    );
  }

  if (scope === "default") {
    const title = item.name || item.variables["idea"] || "Untitled Outline";
    return matchesSearchQuery(title, trimmed);
  }

  if (scope === "idea") {
    const ideaVal = item.variables["idea"] || "";
    return matchesSearchQuery(ideaVal, trimmed);
  }

  if (scope === "output") {
    const outputVal = item.output || "";
    return matchesSearchQuery(outputVal, trimmed);
  }

  if (scope === "visual_reference") {
    const imageLabels = (item.images || []).map((img) => img.label);
    const videoLabels = (item.videos || []).map((vid) => vid.label);
    return matchesSearchQuery([...imageLabels, ...videoLabels], trimmed);
  }

  if (scope === "parameters") {
    const paramKeys = Object.keys(item.variables || {});
    const paramValues = Object.values(item.variables || {});
    return matchesSearchQuery([...paramKeys, ...paramValues], trimmed);
  }

  if (scope === "compiled_prompt") {
    const filledVal = item.filledPrompt || "";
    return matchesSearchQuery(filledVal, trimmed);
  }

  return true;
}

/**
 * Filters history items based on search, active tab (all/favorites), and filter state
 */
export function filterHistoryItems(
  history: HistoryItem[],
  activeTab: "all" | "favorites",
  searchQuery: string,
  filterState: HistoryFilterState
): HistoryItem[] {
  return history.filter((item) => {
    // 1. Favorites Tab Filter
    if (activeTab === "favorites" && !item.isFavorite) return false;

    // 2. Search Query & Scope Filter
    if (!matchItemSearch(item, searchQuery, filterState.searchScope)) return false;

    // 3. Preset Filter
    if (filterState.presetFilter !== "all") {
      if (filterState.presetFilter === "custom") {
        if (item.presetLabel) return false;
      } else {
        if (item.presetLabel !== filterState.presetFilter) return false;
      }
    }

    // 4. Model Filter
    if (filterState.modelFilter !== "all") {
      if (item.model !== filterState.modelFilter) return false;
    }

    // 5. Reasoning / Thinking Level Filter
    if (filterState.thinkingFilter !== "all") {
      if (filterState.thinkingFilter === "OFF") {
        if (item.thinkingLevel && item.thinkingLevel !== "OFF") return false;
      } else {
        if (item.thinkingLevel !== filterState.thinkingFilter) return false;
      }
    }

    // 6. Media Filters (Multi-select with AND logic)
    if (filterState.mediaFilters.length > 0) {
      for (const mediaType of filterState.mediaFilters) {
        if (mediaType === "image" && !itemHasImages(item)) return false;
        if (mediaType === "video" && !itemHasVideos(item)) return false;
        if (mediaType === "audio" && !itemHasAudios(item)) return false;
        if (mediaType === "doc" && !itemHasDocs(item)) return false;
      }
    }

    return true;
  });
}

/**
 * Sorts history items according to selected sort option
 */
export function sortHistoryItems(
  items: HistoryItem[],
  sortBy: HistorySortOption
): HistoryItem[] {
  const shallowCopy = [...items];

  switch (sortBy) {
    case "date_desc":
      return shallowCopy.sort((a, b) => parseHistoryDate(b) - parseHistoryDate(a));
    case "date_asc":
      return shallowCopy.sort((a, b) => parseHistoryDate(a) - parseHistoryDate(b));
    case "cost_desc":
      return shallowCopy.sort(
        (a, b) => parseCostNumeric(b.estimatedCost) - parseCostNumeric(a.estimatedCost)
      );
    case "cost_asc":
      return shallowCopy.sort(
        (a, b) => parseCostNumeric(a.estimatedCost) - parseCostNumeric(b.estimatedCost)
      );
    case "name_asc":
      return shallowCopy.sort((a, b) => {
        const titleA = (a.name || a.variables["idea"] || "Untitled Outline").toLowerCase();
        const titleB = (b.name || b.variables["idea"] || "Untitled Outline").toLowerCase();
        return titleA.localeCompare(titleB);
      });
    default:
      return shallowCopy;
  }
}

export interface DateGroupSection {
  bucket: DateBucketKey;
  label: string;
  items: HistoryItem[];
}

/**
 * Groups items into date sections (TODAY, YESTERDAY, PREVIOUS 7 DAYS, OLDER)
 */
export function groupHistoryByDate(items: HistoryItem[]): DateGroupSection[] {
  const buckets: Record<DateBucketKey, HistoryItem[]> = {
    "TODAY": [],
    "YESTERDAY": [],
    "PREVIOUS 7 DAYS": [],
    "OLDER": [],
  };

  for (const item of items) {
    const timestamp = parseHistoryDate(item);
    const bucket = getDateBucket(timestamp);
    buckets[bucket].push(item);
  }

  const order: DateBucketKey[] = ["TODAY", "YESTERDAY", "PREVIOUS 7 DAYS", "OLDER"];
  return order
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({
      bucket: key,
      label: key,
      items: buckets[key],
    }));
}

/**
 * Extracts distinct presets with counts from history items
 */
export function getUniquePresets(
  history: HistoryItem[]
): { id: string; label: string; count: number }[] {
  const counts: Record<string, number> = {};
  let customCount = 0;

  for (const item of history) {
    if (item.presetLabel) {
      counts[item.presetLabel] = (counts[item.presetLabel] || 0) + 1;
    } else {
      customCount += 1;
    }
  }

  const results: { id: string; label: string; count: number }[] = Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .map((presetName) => ({
      id: presetName,
      label: presetName,
      count: counts[presetName],
    }));

  if (customCount > 0) {
    results.push({
      id: "custom",
      label: "Custom (No Preset)",
      count: customCount,
    });
  }

  return results;
}

/**
 * Extracts distinct models with counts from history items
 */
export function getUniqueModels(
  history: HistoryItem[]
): { id: string; label: string; count: number }[] {
  const counts: Record<string, number> = {};

  for (const item of history) {
    const model = item.model || "Unknown Model";
    counts[model] = (counts[model] || 0) + 1;
  }

  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .map((modelId) => ({
      id: modelId,
      label: modelId.replace("gemini-", ""),
      count: counts[modelId],
    }));
}

/**
 * Counts how many non-default filters are active
 */
export function countActiveFilters(filterState: HistoryFilterState): number {
  let count = 0;
  if (filterState.sortBy !== "date_desc") count += 1;
  if (filterState.searchScope !== "all") count += 1;
  if (filterState.presetFilter !== "all") count += 1;
  if (filterState.modelFilter !== "all") count += 1;
  if (filterState.thinkingFilter !== "all") count += 1;
  if (filterState.mediaFilters.length > 0) count += filterState.mediaFilters.length;
  return count;
}
