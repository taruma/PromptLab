/**
 * Canonical Type Definitions for History System
 * Single source of truth across components, storage, export, and API layers.
 */

export interface HistoryImage {
  id?: string;
  label: string;
  base64: string;
  mimeType: string;
  isFilesApi?: boolean;
  fileUri?: string;
  expirationTime?: string;
  contentHash?: string;
}

export interface HistoryVideo {
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

export interface HistoryTokenUsage {
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  thoughtTokens?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  variables: Record<string, string>;
  images: HistoryImage[];
  videos?: HistoryVideo[];
  output: string;
  thinkingResult?: string;
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
  tokenUsage?: HistoryTokenUsage;
  estimatedCost?: string;
}

export type HistorySearchScope = 
  | "all"
  | "default" 
  | "idea" 
  | "output" 
  | "visual_reference" 
  | "compiled_prompt";

export type HistorySortOption = 
  | "date_desc" 
  | "date_asc" 
  | "cost_desc" 
  | "cost_asc" 
  | "name_asc";

export type HistoryMediaType = "image" | "video" | "audio" | "doc";

export interface HistoryFilterState {
  sortBy: HistorySortOption;
  searchScope: HistorySearchScope;
  presetFilter: string; // "all" | presetLabel | "custom"
  modelFilter: string;  // "all" | modelName
  thinkingFilter: string; // "all" | "HIGH" | "MEDIUM" | "LOW" | "MINIMAL" | "OFF"
  mediaFilters: HistoryMediaType[]; // multi-select with AND logic
}

export interface HistoryExportResult {
  count: number;
  filename: string;
}
