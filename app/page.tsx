"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { 
  Sparkles, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  History, 
  Eye, 
  EyeOff, 
  Settings, 
  HelpCircle,
  FileText,
  RefreshCw,
  FolderOpen,
  Info,
  Download,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Search,
  GitCompare,
  AlertTriangle,
  Star,
  X,
  ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";

import AssetLibrarySidebar from "../components/AssetLibrarySidebar";
import VisualAssetCard from "../components/VisualAssetCard";
import VideoAssetCard from "../components/VideoAssetCard";
import EngineControlsModal from "../components/EngineControlsModal";
import HistoryViewerModal from "../components/HistoryViewerModal";
import HistorySection from "../components/HistorySection";
import ClearHistoryConfirmModal from "../components/ClearHistoryConfirmModal";
import ClearSessionConfirmModal from "../components/ClearSessionConfirmModal";
import LoadWorkspaceConfirmModal from "../components/LoadWorkspaceConfirmModal";
import DeleteHistoryConfirmModal from "../components/DeleteHistoryConfirmModal";
import DiscardChangesConfirmModal from "../components/DiscardChangesConfirmModal";
import PresetReplaceConfirmModal from "../components/PresetReplaceConfirmModal";
import PresetImportConfirmModal from "../components/PresetImportConfirmModal";
import PromptConfigModal from "../components/PromptConfigModal";
import AddYouTubeModal from "../components/AddYouTubeModal";
import AddFilesApiModal from "../components/AddFilesApiModal";
import YouTubeIcon from "../components/YouTubeIcon";
import AppHeader from "../components/AppHeader";
import LabManualSection from "../components/LabManualSection";
import MainIdeaSection from "../components/MainIdeaSection";
import VisualAssetsSection, { type UploadedImage } from "../components/VisualAssetsSection";
import ParameterInputsSection from "../components/ParameterInputsSection";
import FooterStatusBar from "../components/FooterStatusBar";
import StorageUsageModal from "../components/StorageUsageModal";
import GenerationResultView from "../components/GenerationResultView";
import { useUrlPresetImport } from "../hooks/use-url-preset-import";
import { calculateEstimatedCost } from "../lib/pricing";
import {
  exportPresetsToJSON,
  importPresetsFromJSON,
  type UserPreset,
} from "../lib/preset-export";
import {
  PresetCompareModal,
  type PresetConfig,
} from "../components/PresetCompareModal";
import ProjectManagerModal from "../components/ProjectManagerModal";
import {
  Project,
  ProjectAsset,
  initProjects,
  getProject,
  saveProject,
  getAllProjects,
  subscribeProjectChanges,
  broadcastProjectChange,
  syncActiveProjectToLocalStorage,
  getCurrentProjectId,
  setCurrentProjectId
} from "../lib/projects";
import {
  openDB,
  getStoredImage,
  saveStoredImage,
  deleteStoredImage,
  deduplicateStoredImages
} from "../lib/indexeddb";
import {
  getRawUrl,
  compressImageToJpeg,
  formatPresetDateShort
} from "../lib/utils";
import {
  validateAndProcessVideo,
  type UploadedVideo
} from "../lib/video-utils";
import { computeContentHash, ensureHistoryHasContentHashes } from "../lib/content-hash";
import { saveHistoryToLocalStorage, loadHistoryFromStorage } from "../lib/history-storage";

export interface HistoryItem {
  id: string;
  timestamp: string;
  variables: Record<string, string>;
  images: { id?: string; label: string; base64: string; mimeType: string; isFilesApi?: boolean; fileUri?: string; expirationTime?: string; contentHash?: string }[];
  videos?: { id?: string; label: string; mimeType?: string; duration?: number; youtubeUrl?: string; isYouTube?: boolean; base64?: string; isFilesApi?: boolean; fileUri?: string; expirationTime?: string; processingMode?: "STATIC" | "AGENTIC" }[];
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
  tokenUsage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
    cachedTokens?: number;
    thoughtTokens?: number;
  };
  estimatedCost?: string;
}

export default function PromptGeneratorPage() {
  // Config loaded from backend or local storage
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [promptTemplate, setPromptTemplate] = useState<string>("");
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState<string>("");
  const [defaultPromptTemplate, setDefaultPromptTemplate] = useState<string>("");
  const [variables, setVariables] = useState<string[]>([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState<boolean>(false);
  const [isFilesApiModalOpen, setIsFilesApiModalOpen] = useState<boolean>(false);

  // User input states
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // Generation state
  const [generationResult, setGenerationResult] = useState<string>("");
  const [filledPrompt, setFilledPrompt] = useState<string>("");
  const [thinkingResult, setThinkingResult] = useState<string>("");
  const [tokenUsage, setTokenUsage] = useState<{ promptTokens?: number; candidatesTokens?: number; totalTokens?: number; cachedTokens?: number; thoughtTokens?: number } | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Workspace UI states
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyTab, setHistoryTab] = useState<"all" | "favorites">("all");
  const [copied, setCopied] = useState<boolean>(false);
  const [showCompiled, setShowCompiled] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [isHistoryClearConfirmOpen, setIsHistoryClearConfirmOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [isHistoryViewerOpen, setIsHistoryViewerOpen] = useState<boolean>(false);
  const [isLabManualOpen, setIsLabManualOpen] = useState<boolean>(true);
  const [isVisualAssetsOpen, setIsVisualAssetsOpen] = useState<boolean>(true);
  const [storageWarningMessage, setStorageWarningMessage] = useState<string | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);
  const [pendingLoadItem, setPendingLoadItem] = useState<HistoryItem | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const toggleHistory = () => {
    setIsHistoryOpen(prev => {
      const newVal = !prev;
      localStorage.setItem("prompt_generator_history_open", String(newVal));
      return newVal;
    });
  };

  const toggleLabManual = () => {
    setIsLabManualOpen(prev => {
      const newVal = !prev;
      localStorage.setItem("prompt_generator_lab_manual_open", String(newVal));
      return newVal;
    });
  };

  const toggleVisualAssets = () => {
    setIsVisualAssetsOpen(prev => {
      const newVal = !prev;
      localStorage.setItem("prompt_generator_visual_assets_open", String(newVal));
      return newVal;
    });
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Prompt Config Modal state
  const [isPromptConfigOpen, setIsPromptConfigOpen] = useState<boolean>(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState<string>("");
  const [tempPromptTemplate, setTempPromptTemplate] = useState<string>("");
  const [presets, setPresets] = useState<Array<{ id: string; name: string; systemPrompt: string; promptTemplate: string; createdAt?: string; updatedAt?: string }>>([]);
  const [customPresets, setCustomPresets] = useState<UserPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [isSystemPresetsOpen, setIsSystemPresetsOpen] = useState<boolean>(true);
  const [isCustomPresetsOpen, setIsCustomPresetsOpen] = useState<boolean>(true);
  const [activeEditingPresetId, setActiveEditingPresetId] = useState<string | null>(null);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState<boolean>(false);
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);
  const [pendingQuickPreset, setPendingQuickPreset] = useState<{ id: string; name: string; systemPrompt: string; promptTemplate: string } | null>(null);
  const [isPresetReplaceConfirmOpen, setIsPresetReplaceConfirmOpen] = useState<boolean>(false);
  const [presetStatusBanner, setPresetStatusBanner] = useState<{ message: string; isError?: boolean } | null>(null);
  const initialPresetSnapshotRef = useRef<{ loadedPresetId: string | null; activeEditingPresetId: string | null; newPresetName: string }>({
    loadedPresetId: null,
    activeEditingPresetId: null,
    newPresetName: "",
  });
  
  // Preset Search, Filter, Pinning & Sorting
  const [presetSearch, setPresetSearch] = useState<string>("");
  const [activePresetTab, setActivePresetTab] = useState<"all" | "system" | "custom">("all");
  const [pinnedPresetIds, setPinnedPresetIds] = useState<string[]>([]);
  const [presetSortMode, setPresetSortMode] = useState<"date-new" | "date-old" | "name-asc" | "name-desc">("date-new");

  const togglePinPreset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updatedPinned: string[] = [];
    setPinnedPresetIds(prev => {
      updatedPinned = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      try {
        localStorage.setItem("prompt_generator_pinned_presets", JSON.stringify(updatedPinned));
      } catch (err) {
        console.error("Failed to save pinned presets", err);
      }
      return updatedPinned;
    });

    setCustomPresets(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          return { ...p, isFavorite: updatedPinned.includes(id) };
        }
        return p;
      });
      try {
        localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to update custom presets in localStorage", err);
      }
      return updated;
    });
  };

  const handleSortChange = (mode: "date-new" | "date-old" | "name-asc" | "name-desc") => {
    setPresetSortMode(mode);
    try {
      localStorage.setItem("prompt_generator_preset_sort", mode);
    } catch (e) {
      console.error("Failed to save preset sort mode", e);
    }
  };

  const sortAndFilterPresets = <T extends { id: string; name: string; systemPrompt: string; promptTemplate: string; createdAt?: string; updatedAt?: string }>(presetList: T[]): T[] => {
    const filtered = presetList.filter(p => p.name.toLowerCase().includes(presetSearch.toLowerCase()));
    
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedPresetIds.includes(a.id);
      const bPinned = pinnedPresetIds.includes(b.id);
      
      // Pinned items always sort to top
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      if (presetSortMode === "date-new") {
        const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        if (bTime !== aTime) return bTime - aTime;
      } else if (presetSortMode === "date-old") {
        const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        if (bTime !== aTime) return aTime - bTime;
      } else if (presetSortMode === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  };

  const handlePresetTabChange = (tab: "all" | "system" | "custom") => {
    setActivePresetTab(tab);
    try {
      localStorage.setItem("prompt_generator_preset_filter_tab", tab);
    } catch (e) {
      console.error("Failed to save preset filter tab", e);
    }
  };
  
  // Projects states
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState<boolean>(false);

  // Compare Preset states
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [comparePreset, setComparePreset] = useState<PresetConfig | null>(null);
  
  // Engine Controls states
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.8-flash");
  const [thinkingLevel, setThinkingLevel] = useState<string>("MEDIUM");
  const [temperature, setTemperature] = useState<number>(1.0);
  const [maxTokens, setMaxTokens] = useState<string>("");
  const [isStructuredOutput, setIsStructuredOutput] = useState<boolean>(false);
  const [responseSchema, setResponseSchema] = useState<string>("");
  
  // Engine Controls Modal states
  const [isEngineConfigOpen, setIsEngineConfigOpen] = useState<boolean>(false);
  
  // Custom User API Key Overrides
  const [customApiKey, setCustomApiKey] = useState<string>("");
  
  // Operational Telemetry states
  const [lastLatency, setLastLatency] = useState<number>(0);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSwitchingProjectRef = useRef<boolean>(false);

  // Helper: extract variables dynamically on the client
  const extractVariables = (templateText: string): string[] => {
    const matches = Array.from(templateText.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g));
    const vars = new Set<string>();
    for (const match of matches) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  };

  // URL Preset Import hook
  const {
    urlPresetData,
    setUrlPresetData,
    isUrlImportConfirmOpen,
    setIsUrlImportConfirmOpen,
    urlImportPending,
    setUrlImportPending,
    urlImportError,
    setUrlImportError,
    urlImportSuccessMsg,
    setUrlImportSuccessMsg,
    applyToWorkspace,
    setApplyToWorkspace,
    importStrategy,
    onSetImportStrategy,
    openJsonPresetImport,
    handleApplyUrlPreset,
    handleCancelUrlPreset,
  } = useUrlPresetImport({
    customPresets,
    pinnedPresetIds,
    setCustomPresets,
    setPinnedPresetIds,
    setLoadedPresetId,
    setActiveEditingPresetId,
    setNewPresetName,
    setSystemPrompt,
    setPromptTemplate,
    setVariables,
    setInputs,
    setUploadedImages,
    setUploadedVideos,
    setGenerationResult,
    setFilledPrompt,
    setThinkingResult,
    setIsThinking,
    extractVariables,
  });

  // Fetch prompt configuration from backend/localStorage on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/prompt-config");
        const data = await res.json();
        
        if (res.ok) {
          if (data.systemPrompt) setDefaultSystemPrompt(data.systemPrompt);
          if (data.promptTemplate) setDefaultPromptTemplate(data.promptTemplate);

          if (data.presets) {
            setPresets(data.presets);
          }

          // Initialize projects subsystem (migrations & project loading)
          try {
            const { projects: loadedProjects, activeProject: currentProj } = await initProjects(
              data.systemPrompt || "",
              data.promptTemplate || ""
            );
            setProjects(loadedProjects);
            setActiveProject(currentProj);

            // Run background IndexedDB image deduplication & contentHash migration
            deduplicateStoredImages().catch((dedupErr) => {
              console.warn("Background IndexedDB deduplication failed:", dedupErr);
            });
          } catch (projErr) {
            console.error("Failed to initialize projects subsystem:", projErr);
          }

          // Load custom presets from local storage
          try {
            const savedCustomPresets = localStorage.getItem("prompt_generator_custom_presets");
            if (savedCustomPresets) {
              setCustomPresets(JSON.parse(savedCustomPresets));
            }
          } catch (e) {
            console.error("Failed to parse custom presets", e);
          }

          const savedSystemPrompt = localStorage.getItem("prompt_generator_system_prompt");
          const savedPromptTemplate = localStorage.getItem("prompt_generator_prompt_template");

          let activeSystemPrompt = "";
          let activePromptTemplate = "";
          let activeVars: string[] = [];

          if (savedSystemPrompt !== null && savedPromptTemplate !== null) {
            activeSystemPrompt = savedSystemPrompt;
            activePromptTemplate = savedPromptTemplate;
            activeVars = extractVariables(savedPromptTemplate);
          } else {
            activeSystemPrompt = data.systemPrompt || "";
            activePromptTemplate = data.promptTemplate || "";
            activeVars = data.variables || [];
          }

          setSystemPrompt(activeSystemPrompt);
          setPromptTemplate(activePromptTemplate);
          setVariables(activeVars);

          // Restore loaded preset ID from local storage on mount
          try {
            const savedLoadedPresetId = localStorage.getItem("prompt_generator_loaded_preset_id");
            if (savedLoadedPresetId) {
              setLoadedPresetId(savedLoadedPresetId);
              let parsedCustom: UserPreset[] = [];
              const rawCustom = localStorage.getItem("prompt_generator_custom_presets");
              if (rawCustom) {
                try { parsedCustom = JSON.parse(rawCustom); } catch (e) {}
              }
              const customMatch = parsedCustom.find((p) => p.id === savedLoadedPresetId);
              if (customMatch) {
                setActiveEditingPresetId(customMatch.id);
                setNewPresetName(customMatch.name);
              }
            }
          } catch (e) {
            console.error("Failed to restore saved loaded preset id", e);
          }

          const initialInputs: Record<string, string> = {};
          activeVars.forEach((v: string) => {
            if (v !== "visual_references" && v !== "cast") {
              initialInputs[v] = "";
            }
          });

          // Load active inputs from local storage
          try {
            const savedInputs = localStorage.getItem("prompt_generator_active_inputs");
            if (savedInputs) {
              const parsedInputs = JSON.parse(savedInputs);
              const validVarSet = new Set([...activeVars, "idea"]);
              const cleanedSavedInputs: Record<string, string> = {};
              Object.keys(parsedInputs).forEach((k) => {
                if (validVarSet.has(k)) {
                  cleanedSavedInputs[k] = parsedInputs[k];
                }
              });
              const mergedInputs = { ...initialInputs, ...cleanedSavedInputs };
              setInputs(mergedInputs);
            } else {
              setInputs(initialInputs);
            }
          } catch (e) {
            console.error("Failed to parse saved inputs", e);
            setInputs(initialInputs);
          }

          // Load uploaded images from local storage & IndexedDB
          try {
            const savedImages = localStorage.getItem("prompt_generator_uploaded_images");
            if (savedImages) {
              const parsedImages = JSON.parse(savedImages) as UploadedImage[];
              const resolvedImages = await Promise.all(
                parsedImages.map(async (img) => {
                  let b64 = img.base64;
                  if (b64) {
                    // Backward compatibility: base64 exists in localStorage. Migrate to IndexedDB.
                    try {
                      await saveStoredImage(img.id, b64);
                    } catch (err) {
                      console.error("Failed to migrate existing localStorage image to IndexedDB:", err);
                    }
                  } else {
                    // Fetch from IndexedDB
                    try {
                      const dbBase64 = await getStoredImage(img.id);
                      if (dbBase64) {
                        b64 = dbBase64;
                      }
                    } catch (err) {
                      console.error(`Failed to load image ${img.id} from IndexedDB:`, err);
                    }
                  }
                  const contentHash = img.contentHash || (b64 ? await computeContentHash(b64) : undefined);
                  return { ...img, base64: b64 || "", contentHash };
                })
              );
              setUploadedImages(resolvedImages);
            }
          } catch (e) {
            console.error("Failed to parse/load saved images", e);
          }

          // Load uploaded videos from local storage & IndexedDB
          try {
            const savedVideos = localStorage.getItem("prompt_generator_uploaded_videos");
            if (savedVideos) {
              const parsedVideos = JSON.parse(savedVideos) as UploadedVideo[];
              const resolvedVideos = await Promise.all(
                parsedVideos.map(async (vid) => {
                  if (vid.base64) {
                    try {
                      await saveStoredImage(vid.id, vid.base64);
                    } catch (err) {
                      console.error("Failed to migrate existing video to IndexedDB:", err);
                    }
                    return vid;
                  } else {
                    try {
                      const dbBase64 = await getStoredImage(vid.id);
                      if (dbBase64) {
                        return { ...vid, base64: dbBase64 };
                      }
                    } catch (err) {
                      console.error(`Failed to load video ${vid.id} from IndexedDB:`, err);
                    }
                    return vid;
                  }
                })
              );
              setUploadedVideos(resolvedVideos);
            }
          } catch (e) {
            console.error("Failed to parse/load saved videos", e);
          }

          // Load previous generation outputs from local storage
          try {
            const savedGenResult = localStorage.getItem("prompt_generator_generation_result");
            if (savedGenResult) {
              setGenerationResult(savedGenResult);
            }
            const savedThinkingResult = localStorage.getItem("prompt_generator_thinking_result");
            if (savedThinkingResult) {
              setThinkingResult(savedThinkingResult);
            }
            const savedFilledPrompt = localStorage.getItem("prompt_generator_filled_prompt");
            if (savedFilledPrompt) {
              setFilledPrompt(savedFilledPrompt);
            }
            const savedTokenUsage = localStorage.getItem("prompt_generator_token_usage");
            if (savedTokenUsage) {
              try {
                setTokenUsage(JSON.parse(savedTokenUsage));
              } catch (e) {
                console.error("Failed to parse saved token usage", e);
              }
            }
          } catch (e) {
            console.error("Failed to parse saved output states", e);
          }

          setIsConfigLoaded(true);
        } else {
          setError("Failed to load prompt files: " + data.error);
        }
      } catch (err: any) {
        setError("Error connecting to server configuration: " + err.message);
      }
    }
    loadConfig();

    // Load local storage engine configs & UI collapsible preferences on mount
    try {
      const savedModel = localStorage.getItem("prompt_generator_selected_model");
      const savedThinking = localStorage.getItem("prompt_generator_thinking_level");
      const savedTemp = localStorage.getItem("prompt_generator_temperature");
      const savedMaxTokens = localStorage.getItem("prompt_generator_max_tokens");
      const savedApiKey = localStorage.getItem("prompt_generator_custom_api_key");
      const savedHistoryOpen = localStorage.getItem("prompt_generator_history_open");
      const savedSysPresetsOpen = localStorage.getItem("prompt_generator_sys_presets_open");
      const savedCustomPresetsOpen = localStorage.getItem("prompt_generator_custom_presets_open");
      const savedLabManualOpen = localStorage.getItem("prompt_generator_lab_manual_open");
      const savedVisualAssetsOpen = localStorage.getItem("prompt_generator_visual_assets_open");
      const savedPresetFilterTab = localStorage.getItem("prompt_generator_preset_filter_tab");
      const savedPinnedPresets = localStorage.getItem("prompt_generator_pinned_presets");
      const savedPresetSort = localStorage.getItem("prompt_generator_preset_sort");

      setTimeout(() => {
        if (savedPinnedPresets) {
          try {
            setPinnedPresetIds(JSON.parse(savedPinnedPresets));
          } catch (e) {}
        }
        if (savedPresetSort === "name-asc" || savedPresetSort === "name-desc" || savedPresetSort === "date-new" || savedPresetSort === "date-old") {
          setPresetSortMode(savedPresetSort);
        }
        if (savedLabManualOpen !== null) {
          setIsLabManualOpen(savedLabManualOpen === "true");
        }
        if (savedVisualAssetsOpen !== null) {
          setIsVisualAssetsOpen(savedVisualAssetsOpen === "true");
        }
        if (savedModel) {
          setSelectedModel(savedModel);
        }
        if (savedThinking) {
          setThinkingLevel(savedThinking);
        }
        if (savedTemp) {
          const numTemp = Number(savedTemp);
          setTemperature(numTemp);
        }
        if (savedMaxTokens) {
          setMaxTokens(savedMaxTokens);
        }

        const savedStructured = localStorage.getItem("prompt_generator_structured_output");
        if (savedStructured !== null) {
          setIsStructuredOutput(savedStructured === "true");
        }
        const savedSchema = localStorage.getItem("prompt_generator_response_schema");
        if (savedSchema !== null) {
          setResponseSchema(savedSchema);
        }

        // Migrate or load custom API keys from vault
        const savedKeysStr = localStorage.getItem("prompt_generator_custom_api_keys");
        const savedActiveId = localStorage.getItem("prompt_generator_active_api_key_id") || "";
        let keysList: { id: string; label: string; key: string }[] = [];
        if (savedKeysStr) {
          try {
            keysList = JSON.parse(savedKeysStr);
          } catch (e) {
            keysList = [];
          }
        }

        if (savedApiKey && savedApiKey.trim() && keysList.length === 0) {
          const defaultId = "key-" + Date.now();
          keysList = [{ id: defaultId, label: "Default Key", key: savedApiKey }];
          localStorage.setItem("prompt_generator_custom_api_keys", JSON.stringify(keysList));
          localStorage.setItem("prompt_generator_active_api_key_id", defaultId);
          localStorage.removeItem("prompt_generator_custom_api_key");
          setCustomApiKey(savedApiKey);
        } else {
          const activeKeyObj = keysList.find(k => k.id === savedActiveId);
          if (activeKeyObj) {
            setCustomApiKey(activeKeyObj.key);
          } else {
            setCustomApiKey("");
          }
        }

        if (savedHistoryOpen !== null) {
          setIsHistoryOpen(savedHistoryOpen === "true");
        }
        if (savedSysPresetsOpen !== null) {
          setIsSystemPresetsOpen(savedSysPresetsOpen === "true");
        }
        if (savedCustomPresetsOpen !== null) {
          setIsCustomPresetsOpen(savedCustomPresetsOpen === "true");
        }
        if (savedPresetFilterTab === "all" || savedPresetFilterTab === "system" || savedPresetFilterTab === "custom") {
          setActivePresetTab(savedPresetFilterTab as "all" | "system" | "custom");
        }
      }, 0);
    } catch (e) {
      console.error("Failed to parse configurations on mount", e);
    }

    // Load history safely on mount (IndexedDB first, localStorage fallback) and sanitize dead parameters
    setTimeout(async () => {
      try {
        const loadedHistory = await loadHistoryFromStorage();
        if (loadedHistory && loadedHistory.length > 0) {
          let wasModified = false;

          const cleanedHistory = loadedHistory.map((item) => {
            if (!item.variables) return item;

            // Clean variables strictly if promptTemplate is stored with the history item
            if (item.promptTemplate) {
              const matches = Array.from(item.promptTemplate.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g));
              const validVarSet = new Set([...matches.map((m) => m[1]), "idea"]);

              const entries = Object.entries(item.variables);
              const cleanVars: Record<string, string> = {};
              let itemChanged = false;

              entries.forEach(([key, val]) => {
                if (key === "visual_references" || key === "cast") {
                  itemChanged = true;
                  return;
                }
                if (validVarSet.has(key)) {
                  cleanVars[key] = val;
                } else {
                  itemChanged = true;
                }
              });

              if (itemChanged) {
                wasModified = true;
                return { ...item, variables: cleanVars };
              }
            }

            return item;
          });

          const { updatedHistory, modified: hashesAdded } = await ensureHistoryHasContentHashes(cleanedHistory);

          if (wasModified || hashesAdded) {
            saveHistoryToLocalStorage(updatedHistory);
          }

          setHistory(updatedHistory);
        }
      } catch (e) {
        console.error("Failed to load generation history", e);
      }
    }, 0);
  }, []);

  // Project Helper Methods & Sync Effects
  const handleProjectsUpdated = async () => {
    try {
      const all = await getAllProjects();
      if (all.length === 0) {
        const { projects: reloadedProjects, activeProject: currentProj } = await initProjects(
          defaultSystemPrompt,
          defaultPromptTemplate
        );
        setProjects(reloadedProjects);
        setActiveProject(currentProj);
        return;
      }

      setProjects(all);
      const currentId = getCurrentProjectId();
      const curr = all.find((p) => p.id === currentId);
      if (curr) {
        setActiveProject(curr);
      } else if (all.length > 0) {
        await handleSwitchProject(all[0].id);
      }
    } catch (err) {
      console.error("Failed to reload projects list:", err);
    }
  };

  const handleSwitchProject = async (targetProjectId: string) => {
    try {
      const targetProject = await getProject(targetProjectId);
      if (!targetProject) return;

      isSwitchingProjectRef.current = true;

      // Sync active project data to localStorage
      syncActiveProjectToLocalStorage(targetProject);
      setActiveProject(targetProject);
      setCurrentProjectId(targetProjectId);

      // Load target project configurations into page state
      setSystemPrompt(targetProject.systemPrompt || "");
      setPromptTemplate(targetProject.promptTemplate || "");
      setCustomPresets(targetProject.customPresets || []);
      setHistory(targetProject.history || []);

      const vars = extractVariables(targetProject.promptTemplate || "");
      setVariables(vars);

      // Reset active session workspace inputs & media assets
      setInputs({});
      localStorage.removeItem("prompt_generator_active_inputs");
      setUploadedImages([]);
      localStorage.removeItem("prompt_generator_uploaded_images");
      setUploadedVideos([]);
      localStorage.removeItem("prompt_generator_uploaded_videos");
      setGenerationResult("");
      localStorage.removeItem("prompt_generator_generation_result");
      setThinkingResult("");
      localStorage.removeItem("prompt_generator_thinking_result");
      setFilledPrompt("");
      localStorage.removeItem("prompt_generator_filled_prompt");

      // Reset preset editing state
      setActiveEditingPresetId(null);
      setLoadedPresetId(null);
      setNewPresetName("");

      // Broadcast project switch across tabs
      broadcastProjectChange("switch", targetProjectId);

      // Refresh project list
      const all = await getAllProjects();
      setProjects(all);

      setTimeout(() => {
        isSwitchingProjectRef.current = false;
      }, 150);
    } catch (err) {
      console.error("Failed to switch project:", err);
      isSwitchingProjectRef.current = false;
    }
  };

  // Subscribe to multi-tab project changes
  useEffect(() => {
    const unsubscribe = subscribeProjectChanges(async ({ action }) => {
      const all = await getAllProjects();
      setProjects(all);
      const currentId = getCurrentProjectId();
      const curr = all.find((p) => p.id === currentId);
      if (curr) {
        if (action === "switch") {
          isSwitchingProjectRef.current = true;
          setActiveProject(curr);
          setSystemPrompt(curr.systemPrompt || "");
          setPromptTemplate(curr.promptTemplate || "");
          setCustomPresets(curr.customPresets || []);
          setHistory(curr.history || []);
          setVariables(extractVariables(curr.promptTemplate || ""));
          setTimeout(() => {
            isSwitchingProjectRef.current = false;
          }, 150);
        } else {
          setActiveProject(curr);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync asset library modifications directly to active project
  const handleAssetLibraryUpdated = useCallback((assets: ProjectAsset[]) => {
    if (isSwitchingProjectRef.current) return;
    setActiveProject((prev) => {
      if (!prev) return prev;
      if (JSON.stringify(prev.assetLibrary) === JSON.stringify(assets)) {
        return prev;
      }
      const updated: Project = { ...prev, assetLibrary: assets };
      saveProject(updated).catch((err) => {
        console.error("Failed to update project asset library:", err);
      });
      return updated;
    });
  }, []);

  // Auto-save active project updates to IndexedDB
  useEffect(() => {
    if (!activeProject || !isConfigLoaded || isSwitchingProjectRef.current) return;

    // Safety check: ensure activeProject matches currently selected project
    const currentId = getCurrentProjectId();
    if (activeProject.id !== currentId) return;

    const updatedProject: Project = {
      ...activeProject,
      systemPrompt,
      promptTemplate,
      customPresets,
      history,
      updatedAt: new Date().toISOString(),
    };

    saveProject(updatedProject).catch((err) => {
      console.error("Failed to auto-save project changes:", err);
    });
  }, [systemPrompt, promptTemplate, customPresets, history, activeProject, isConfigLoaded]);

  // Determine if current active workspace has session data
  const hasActiveSessionData = Boolean(
    (inputs["idea"] && inputs["idea"].trim().length > 0) ||
    Object.keys(inputs).some((k) => k !== "idea" && inputs[k] && inputs[k].trim().length > 0) ||
    uploadedImages.length > 0 ||
    uploadedVideos.length > 0 ||
    generationResult.trim().length > 0
  );

  // Save active inputs to localStorage whenever they change
  useEffect(() => {
    if (isConfigLoaded) {
      localStorage.setItem("prompt_generator_active_inputs", JSON.stringify(inputs));
    }
  }, [inputs, isConfigLoaded]);

  // Save uploaded images to localStorage whenever they change (stripping base64 content to conserve space)
  useEffect(() => {
    if (isConfigLoaded) {
      try {
        const strippedImages = uploadedImages.map(({ base64, ...rest }) => rest);
        localStorage.setItem("prompt_generator_uploaded_images", JSON.stringify(strippedImages));
        if (storageWarningMessage !== null) {
          setTimeout(() => {
            setStorageWarningMessage(null);
          }, 0);
        }
      } catch (err: any) {
        if (err.name === "QuotaExceededError" || err.code === 22 || err.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          console.error("Local storage quota exceeded:", err);
          setTimeout(() => {
            setStorageWarningMessage(
              "Browser storage limit reached. Your uploaded images are active and fully operational for this session, but they are too large to save in your browser's local cache."
            );
          }, 0);
        } else {
          console.error("Failed to save images to local storage:", err);
        }
      }
    }
  }, [uploadedImages, isConfigLoaded, storageWarningMessage]);

  // Save uploaded videos to localStorage whenever they change
  useEffect(() => {
    if (isConfigLoaded) {
      try {
        const strippedVideos = uploadedVideos.map(({ base64, ...rest }) => rest);
        localStorage.setItem("prompt_generator_uploaded_videos", JSON.stringify(strippedVideos));
      } catch (err: any) {
        console.error("Failed to save videos to local storage:", err);
      }
    }
  }, [uploadedVideos, isConfigLoaded]);

  // Save active generation results to localStorage whenever they change
  useEffect(() => {
    if (isConfigLoaded) {
      localStorage.setItem("prompt_generator_generation_result", generationResult);
      localStorage.setItem("prompt_generator_thinking_result", thinkingResult);
      localStorage.setItem("prompt_generator_filled_prompt", filledPrompt);
      if (tokenUsage) {
        localStorage.setItem("prompt_generator_token_usage", JSON.stringify(tokenUsage));
      } else {
        localStorage.removeItem("prompt_generator_token_usage");
      }
    }
  }, [generationResult, thinkingResult, filledPrompt, tokenUsage, isConfigLoaded]);

  // Handle escape key to close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDiscardConfirmOpen) {
          setIsDiscardConfirmOpen(false);
        } else if (isPromptConfigOpen) {
          const isModified = tempSystemPrompt !== systemPrompt || tempPromptTemplate !== promptTemplate;
          if (isModified) {
            setIsDiscardConfirmOpen(true);
          } else {
            setIsPromptConfigOpen(false);
          }
        } else if (pendingLoadItem) {
          setPendingLoadItem(null);
        } else if (pendingDeleteId) {
          setPendingDeleteId(null);
        } else {
          setIsLibraryOpen(false);
          setIsEngineConfigOpen(false);
          setIsClearConfirmOpen(false);
          setIsHistoryClearConfirmOpen(false);
          setIsUrlImportConfirmOpen(false);
          setIsCompareOpen(false);
          setUrlPresetData(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPromptConfigOpen, isDiscardConfirmOpen, tempSystemPrompt, tempPromptTemplate, systemPrompt, promptTemplate, pendingLoadItem, pendingDeleteId]);

  // Prevent body scrolling when any major modal is open
  useEffect(() => {
    const isAnyModalOpen = isPromptConfigOpen || isEngineConfigOpen || isCompareOpen || isClearConfirmOpen || isHistoryClearConfirmOpen || isUrlImportConfirmOpen || isDiscardConfirmOpen || isLibraryOpen || !!pendingLoadItem || !!pendingDeleteId;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPromptConfigOpen, isEngineConfigOpen, isCompareOpen, isClearConfirmOpen, isHistoryClearConfirmOpen, isUrlImportConfirmOpen, isDiscardConfirmOpen, isLibraryOpen, pendingLoadItem, pendingDeleteId]);

  // Process selected image files
  const handleImageFiles = async (files: FileList) => {
    const validImages = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validImages.length === 0) return;

    const newUploaded: UploadedImage[] = [];
    
    for (let i = 0; i < validImages.length; i++) {
      const file = validImages[i];
      try {
        const base64 = await compressImageToJpeg(file, 0.9);
        const contentHash = await computeContentHash(base64);
        // Suggest a nice default label based on filename or numbering
        const rawName = file.name.split(".")[0];
        const cleanLabel = rawName
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase());

        const imgId = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
        try {
          await saveStoredImage(imgId, base64, contentHash);
        } catch (dbErr) {
          console.error("Failed to save image to IndexedDB:", dbErr);
        }

        newUploaded.push({
          id: imgId,
          label: cleanLabel,
          base64: base64,
          mimeType: "image/jpeg",
          contentHash,
        });
      } catch (err) {
        console.error("Error loading file: ", file.name, err);
      }
    }

    setUploadedImages(prev => {
      // Append and assign proper @image numbers in order
      return [...prev, ...newUploaded];
    });
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleIncomingFiles(e.target.files);
    }
  };

  // Process selected video files (<30s duration, .mp4, <=720p height)
  const handleVideoFiles = async (files: FileList) => {
    setVideoError(null);
    const videoFiles = Array.from(files).filter(
      f => f.type.startsWith("video/") || f.name.toLowerCase().endsWith(".mp4")
    );
    if (videoFiles.length === 0) return;

    const newUploadedVideos: UploadedVideo[] = [];
    const errors: string[] = [];

    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      const result = await validateAndProcessVideo(file);
      if (!result.valid || !result.base64) {
        errors.push(result.error || `Invalid video file ${file.name}`);
        continue;
      }

      const rawName = file.name.split(".")[0];
      const cleanLabel = rawName
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

      const vidId = `vid-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
      try {
        await saveStoredImage(vidId, result.base64);
      } catch (dbErr) {
        console.error("Failed to save video to IndexedDB:", dbErr);
      }

      newUploadedVideos.push({
        id: vidId,
        label: cleanLabel,
        base64: result.base64,
        mimeType: file.type || "video/mp4",
        duration: result.duration,
        width: result.width,
        height: result.height,
      });
    }

    if (errors.length > 0) {
      setVideoError(errors.join(" "));
    }

    if (newUploadedVideos.length > 0) {
      setUploadedVideos(prev => [...prev, ...newUploadedVideos]);
    }
  };

  // Route incoming files to appropriate image or video processing handlers
  const handleIncomingFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith("image/"));
    const videoFiles = fileArray.filter(
      f => f.type.startsWith("video/") || f.name.toLowerCase().endsWith(".mp4")
    );

    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      imageFiles.forEach(f => dt.items.add(f));
      await handleImageFiles(dt.files);
    }

    if (videoFiles.length > 0) {
      const dt = new DataTransfer();
      videoFiles.forEach(f => dt.items.add(f));
      await handleVideoFiles(dt.files);
    }
  };

  // Add YouTube video reference to workspace
  const handleAddYouTubeVideo = (url: string, label: string) => {
    const newVid: UploadedVideo = {
      id: `yt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: label || `YouTube Clip ${uploadedVideos.length + 1}`,
      youtubeUrl: url,
      isYouTube: true,
      mimeType: "video/youtube",
    };
    setUploadedVideos(prev => [...prev, newVid]);
  };

  // Handle successful Files API upload (images and videos)
  const handleFilesApiUploadSuccess = (mediaData: {
    label: string;
    fileUri: string;
    mimeType: string;
    sizeBytes: number;
    expirationTime?: string;
    isImage: boolean;
    fileObj?: File;
  }) => {
    const localBlobUrl = mediaData.fileObj ? URL.createObjectURL(mediaData.fileObj) : "";

    if (mediaData.isImage) {
      const newImg: UploadedImage = {
        id: `files_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        label: mediaData.label,
        base64: localBlobUrl,
        blobUrl: localBlobUrl,
        mimeType: mediaData.mimeType,
        isFilesApi: true,
        fileUri: mediaData.fileUri,
        sizeBytes: mediaData.sizeBytes,
        expirationTime: mediaData.expirationTime,
      };
      setUploadedImages((prev) => [...prev, newImg]);
    } else {
      const newVid: UploadedVideo = {
        id: `files_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        label: mediaData.label,
        blobUrl: localBlobUrl,
        base64: localBlobUrl,
        mimeType: mediaData.mimeType,
        isFilesApi: true,
        fileUri: mediaData.fileUri,
        sizeBytes: mediaData.sizeBytes,
        expirationTime: mediaData.expirationTime,
      };
      setUploadedVideos((prev) => [...prev, newVid]);
    }
  };

  // Update label of specific uploaded video
  const handleUpdateVideoLabel = (id: string, value: string) => {
    setUploadedVideos(prev =>
      prev.map(vid => vid.id === id ? { ...vid, label: value } : vid)
    );
  };

  // Delete uploaded video
  const handleDeleteVideo = (id: string) => {
    setUploadedVideos(prev => prev.filter(vid => vid.id !== id));
    try {
      deleteStoredImage(id);
    } catch (err) {
      console.error("Failed to delete video from IndexedDB:", err);
    }
  };

  // Toggle video processing mode (STATIC vs AGENTIC)
  const handleToggleVideoProcessingMode = (id: string, mode: "STATIC" | "AGENTIC") => {
    setUploadedVideos(prev =>
      prev.map(vid => vid.id === id ? { ...vid, processingMode: mode } : vid)
    );
  };

  // Update label of specific uploaded image
  const handleUpdateLabel = (id: string, value: string) => {
    setUploadedImages(prev => 
      prev.map(img => img.id === id ? { ...img, label: value } : img)
    );
  };

  // Add image from library to workspace active session
  const handleAddImageFromLibrary = async (label: string, base64: string) => {
    const imgId = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const contentHash = await computeContentHash(base64);
    try {
      await saveStoredImage(imgId, base64, contentHash);
    } catch (dbErr) {
      console.error("Failed to save image from library to IndexedDB:", dbErr);
    }
    setUploadedImages(prev => [
      ...prev,
      {
        id: imgId,
        label,
        base64,
        mimeType: "image/jpeg",
        contentHash,
      }
    ]);
  };

  // Delete uploaded image
  const handleDeleteImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    try {
      deleteStoredImage(id);
    } catch (err) {
      console.error("Failed to delete image from IndexedDB:", err);
    }
  };

  // Load a historic generation back into the editor
  const handleLoadHistoryItem = async (item: HistoryItem) => {
    // Set inputs cleanly from history item variables
    const updatedInputs: Record<string, string> = {};
    Object.keys(item.variables).forEach(k => {
      if (k !== "visual_references" && k !== "cast") {
        updatedInputs[k] = item.variables[k];
      }
    });
    setInputs(updatedInputs);

    // Load images and resolve base64 from IndexedDB (or migrate if they are embedded in the item)
    const loadedImages: UploadedImage[] = await Promise.all(
      item.images.map(async (img, i) => {
        const newImgId = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
        let base64 = img.base64;

        if (!base64 && img.id) {
          try {
            const dbBase64 = await getStoredImage(img.id);
            if (dbBase64) {
              base64 = dbBase64;
            }
          } catch (err) {
            console.error("Failed to load image from IndexedDB:", err);
          }
        } else if (base64) {
          // Backward compatibility: migrate to IndexedDB
          try {
            await saveStoredImage(newImgId, base64);
          } catch (err) {
            console.error("Failed to migrate legacy image to IndexedDB:", err);
          }
        }

        // Save to IndexedDB under the new active session ID
        if (base64 && !img.base64) {
          try {
            await saveStoredImage(newImgId, base64);
          } catch (err) {
            console.error("Failed to persist loaded image to IndexedDB:", err);
          }
        }

        const contentHash = img.contentHash || (base64 ? await computeContentHash(base64) : undefined);

        return {
          id: newImgId,
          label: img.label,
          base64: base64 || "",
          mimeType: img.mimeType,
          isFilesApi: img.isFilesApi,
          fileUri: img.fileUri,
          expirationTime: img.expirationTime,
          contentHash,
        };
      })
    );
    
    setUploadedImages(loadedImages);

    if (item.videos && item.videos.length > 0) {
      setUploadedVideos(
        item.videos.map((vid, idx) => ({
          id: vid.id || `vid-${Date.now()}-${idx}`,
          label: vid.label,
          base64: vid.base64 || "",
          mimeType: vid.mimeType || (vid.youtubeUrl || vid.isYouTube ? "video/youtube" : "video/mp4"),
          duration: vid.duration,
          youtubeUrl: vid.youtubeUrl,
          isYouTube: vid.isYouTube,
          isFilesApi: vid.isFilesApi,
          fileUri: vid.fileUri,
          expirationTime: vid.expirationTime,
          processingMode: vid.processingMode,
        }))
      );
    } else {
      setUploadedVideos([]);
    }

    setGenerationResult(item.output);
    setFilledPrompt(item.filledPrompt);
    setThinkingResult(item.thinkingResult || "");
    setTokenUsage(item.tokenUsage || null);
    setIsThinking(false);
    setError(null);
  };

  // Clear active inputs and session outputs, keeping custom prompts intact
  const handleClearSession = () => {
    const clearedInputs: Record<string, string> = {};
    variables.forEach((v: string) => {
      if (v !== "visual_references" && v !== "cast") {
        clearedInputs[v] = "";
      }
    });
    // also clear core idea explicitly
    clearedInputs["idea"] = "";
    setInputs(clearedInputs);

    // Delete current images & videos from IndexedDB to avoid storage clutter
    uploadedImages.forEach(img => {
      try {
        deleteStoredImage(img.id);
      } catch (err) {
        console.error("Failed to clean up image on session clear:", err);
      }
    });

    uploadedVideos.forEach(vid => {
      try {
        deleteStoredImage(vid.id);
      } catch (err) {
        console.error("Failed to clean up video on session clear:", err);
      }
    });

    setUploadedImages([]);
    setUploadedVideos([]);
    setGenerationResult("");
    setFilledPrompt("");
    setThinkingResult("");
    setTokenUsage(null);
    setIsThinking(false);
    setError(null);
  };

  // Clear non-favorited history items and their images from IndexedDB
  const handleClearUnfavoritedHistory = () => {
    const favoritedItems = history.filter(item => item.isFavorite);
    const nonFavoritedItems = history.filter(item => !item.isFavorite);

    // Collect image IDs that are kept by favorited items
    const keptImageIds = new Set<string>();
    favoritedItems.forEach(item => {
      if (item.images) {
        item.images.forEach(img => {
          if (img.id) keptImageIds.add(img.id);
        });
      }
    });

    // Delete images belonging to non-favorited items if they aren't used in favorited items
    nonFavoritedItems.forEach(item => {
      if (item.images) {
        item.images.forEach(img => {
          if (img.id && !keptImageIds.has(img.id)) {
            try {
              deleteStoredImage(img.id);
            } catch (err) {
              console.error("Failed to delete history image from IndexedDB on clear unfavorited:", err);
            }
          }
        });
      }
    });

    setHistory(favoritedItems);
    saveHistoryToLocalStorage(favoritedItems);
  };

  // Clear all local session history and their images from IndexedDB
  const handleClearAllHistory = () => {
    history.forEach(item => {
      if (item.images) {
        item.images.forEach(img => {
          if (img.id) {
            try {
              deleteStoredImage(img.id);
            } catch (err) {
              console.error("Failed to delete history image from IndexedDB on clear all:", err);
            }
          }
        });
      }
    });
    setHistory([]);
    try {
      localStorage.removeItem("prompt_generator_history");
    } catch (_) {}
  };

  // Import new history items and persist to local storage
  const handleImportHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    saveHistoryToLocalStorage(newHistory);
  };

  // We manage engine controls configuration via the external EngineControlsModal component.

  // Quick preset selector handler for instant header preset switching
  const applyQuickPreset = (preset: { id: string; name: string; systemPrompt: string; promptTemplate: string }) => {
    setSystemPrompt(preset.systemPrompt);
    setPromptTemplate(preset.promptTemplate);
    const vars = extractVariables(preset.promptTemplate);
    setVariables(vars);

    setInputs(prev => {
      const updated: Record<string, string> = {};
      if (prev["idea"] !== undefined) {
        updated["idea"] = prev["idea"];
      }
      vars.forEach(v => {
        if (v !== "visual_references" && v !== "cast") {
          updated[v] = prev[v] !== undefined ? prev[v] : "";
        }
      });
      return updated;
    });

    localStorage.setItem("prompt_generator_system_prompt", preset.systemPrompt);
    localStorage.setItem("prompt_generator_prompt_template", preset.promptTemplate);

    setLoadedPresetId(preset.id);
    try {
      localStorage.setItem("prompt_generator_loaded_preset_id", preset.id);
    } catch (e) {}

    const isCustom = customPresets.some(p => p.id === preset.id);
    if (isCustom) {
      setActiveEditingPresetId(preset.id);
      setNewPresetName(preset.name);
    } else {
      setActiveEditingPresetId(null);
      setNewPresetName("");
    }
  };

  const handleSelectQuickPreset = (preset: { id: string; name: string; systemPrompt: string; promptTemplate: string }) => {
    const activeLoadedPreset = loadedPresetId
      ? presets.find(p => p.id === loadedPresetId) || customPresets.find(p => p.id === loadedPresetId) || null
      : null;

    const isModified = activeLoadedPreset
      ? (systemPrompt !== activeLoadedPreset.systemPrompt || promptTemplate !== activeLoadedPreset.promptTemplate)
      : false;

    if (isModified) {
      setPendingQuickPreset(preset);
      setIsPresetReplaceConfirmOpen(true);
      return;
    }

    applyQuickPreset(preset);
  };

  // Open the configuration modal
  const handleOpenPromptConfig = () => {
    setPresetStatusBanner(null);
    setTempSystemPrompt(systemPrompt);
    setTempPromptTemplate(promptTemplate);
    
    // Check if current prompts match any existing custom preset or system preset
    const matchingCustom = customPresets.find(
      p => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate
    );
    const matchingSys = presets.find(
      p => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate
    );

    let snapshotLoadedId: string | null = null;
    let snapshotEditingId: string | null = null;
    let snapshotName: string = "";

    if (matchingCustom) {
      snapshotLoadedId = matchingCustom.id;
      snapshotEditingId = matchingCustom.id;
      snapshotName = matchingCustom.name;
      setActiveEditingPresetId(matchingCustom.id);
      setNewPresetName(matchingCustom.name);
      setLoadedPresetId(matchingCustom.id);
      try {
        localStorage.setItem("prompt_generator_loaded_preset_id", matchingCustom.id);
      } catch (e) {}
    } else if (matchingSys) {
      snapshotLoadedId = matchingSys.id;
      snapshotEditingId = null;
      snapshotName = "";
      setActiveEditingPresetId(null);
      setNewPresetName("");
      setLoadedPresetId(matchingSys.id);
      try {
        localStorage.setItem("prompt_generator_loaded_preset_id", matchingSys.id);
      } catch (e) {}
    } else {
      // Current prompts don't match any preset exactly (e.g. user applied edits).
      // Check if previously loaded preset still exists so we preserve its selection with [EDIT] badge.
      const currentLoadedPreset = loadedPresetId
        ? (customPresets.find(p => p.id === loadedPresetId) || presets.find(p => p.id === loadedPresetId) || null)
        : null;

      if (currentLoadedPreset) {
        snapshotLoadedId = currentLoadedPreset.id;
        const isCustom = customPresets.some(p => p.id === currentLoadedPreset.id);
        if (isCustom) {
          snapshotEditingId = currentLoadedPreset.id;
          snapshotName = currentLoadedPreset.name;
          setActiveEditingPresetId(currentLoadedPreset.id);
          setNewPresetName(currentLoadedPreset.name);
        } else {
          snapshotEditingId = null;
          snapshotName = "";
          setActiveEditingPresetId(null);
          setNewPresetName("");
        }
        // Preserve loadedPresetId so modified preset remains selected with [EDIT] indicator
      } else {
        snapshotLoadedId = null;
        snapshotEditingId = null;
        snapshotName = "";
        setActiveEditingPresetId(null);
        setNewPresetName("");
        setLoadedPresetId(null);
        try {
          localStorage.removeItem("prompt_generator_loaded_preset_id");
        } catch (e) {}
      }
    }

    initialPresetSnapshotRef.current = {
      loadedPresetId: snapshotLoadedId,
      activeEditingPresetId: snapshotEditingId,
      newPresetName: snapshotName,
    };
    
    setIsPromptConfigOpen(true);
  };

  // Reset system prompt and prompt template inside the configuration modal
  const handleResetPrompts = () => {
    setPresetStatusBanner(null);
    setActiveEditingPresetId(null);
    setLoadedPresetId(null);
    try {
      localStorage.removeItem("prompt_generator_loaded_preset_id");
    } catch (e) {}
    setNewPresetName("");
    setTempSystemPrompt(defaultSystemPrompt);
    setTempPromptTemplate(defaultPromptTemplate);
    setPresetStatusBanner({ message: "Reset system prompt and prompt template." });
  };

  // Export user presets to JSON file using modular utility
  const handleExportPresets = (exportType: "all" | "favorites" | "selected") => {
    setPresetStatusBanner(null);
    try {
      const activePreset = activeEditingPresetId
        ? customPresets.find((p) => p.id === activeEditingPresetId) || null
        : loadedPresetId
        ? presets.find((p) => p.id === loadedPresetId) || customPresets.find((p) => p.id === loadedPresetId) || null
        : null;

      const { count, filename } = exportPresetsToJSON(
        customPresets,
        exportType,
        activePreset,
        pinnedPresetIds,
        activeProject?.name
      );
      setPresetStatusBanner({
        message: `Successfully exported ${count} preset(s) to "${filename}"`
      });
    } catch (err: any) {
      setPresetStatusBanner({
        message: err.message || "Failed to export presets.",
        isError: true
      });
    }
  };

  // Import user presets from JSON file with duplicate detection using modular utility
  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPresetStatusBanner(null);
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonText = event.target?.result as string;
        openJsonPresetImport(jsonText, file.name);
      } catch (err: any) {
        setPresetStatusBanner({
          message: "Failed to read preset file: " + err.message,
          isError: true
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Save current configurations inside modal as a custom preset in local storage
  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) {
      alert("Please enter a name for your custom preset.");
      return;
    }
    const newId = `custom-preset-${Date.now()}`;
    const nowISO = new Date().toISOString();
    const newPreset: UserPreset = {
      id: newId,
      name: newPresetName.trim(),
      systemPrompt: tempSystemPrompt,
      promptTemplate: tempPromptTemplate,
      createdAt: nowISO,
      updatedAt: nowISO
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(updated));
    setActiveEditingPresetId(newId);
    setLoadedPresetId(newId);
    try {
      localStorage.setItem("prompt_generator_loaded_preset_id", newId);
    } catch (e) {}
  };

  // Update an existing custom preset in local storage
  const handleUpdateCustomPreset = () => {
    if (!activeEditingPresetId) return;
    if (!newPresetName.trim()) {
      alert("Please enter a name for your custom preset.");
      return;
    }
    const nowISO = new Date().toISOString();
    const updated = customPresets.map(p => {
      if (p.id === activeEditingPresetId) {
        return {
          ...p,
          name: newPresetName.trim(),
          systemPrompt: tempSystemPrompt,
          promptTemplate: tempPromptTemplate,
          createdAt: p.createdAt || nowISO,
          updatedAt: nowISO
        };
      }
      return p;
    });
    setCustomPresets(updated);
    localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(updated));
  };

  // Delete a specific custom preset from local storage
  const handleDeleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(updated));
    if (activeEditingPresetId === id) {
      setActiveEditingPresetId(null);
      setNewPresetName("");
    }
    if (loadedPresetId === id) {
      setLoadedPresetId(null);
      try {
        localStorage.removeItem("prompt_generator_loaded_preset_id");
      } catch (e) {}
    }
  };

  // Save the custom configuration to local state and local storage
  const handleApplyPromptConfig = () => {
    setSystemPrompt(tempSystemPrompt);
    setPromptTemplate(tempPromptTemplate);
    const vars = extractVariables(tempPromptTemplate);
    setVariables(vars);

    // Retain previous inputs for active template variables and idea, purge dead keys
    setInputs(prev => {
      const updated: Record<string, string> = {};
      if (prev["idea"] !== undefined) {
        updated["idea"] = prev["idea"];
      }
      vars.forEach(v => {
        if (v !== "visual_references" && v !== "cast") {
          updated[v] = prev[v] !== undefined ? prev[v] : "";
        }
      });
      return updated;
    });

    localStorage.setItem("prompt_generator_system_prompt", tempSystemPrompt);
    localStorage.setItem("prompt_generator_prompt_template", tempPromptTemplate);
    setIsPromptConfigOpen(false);
  };

  // Check if current editor values differ from active workspace
  const isWorkspaceModified = tempSystemPrompt !== systemPrompt || tempPromptTemplate !== promptTemplate;

  // Check if current editor values differ from originally loaded preset values
  const isPresetModified = () => {
    if (!loadedPresetId) return false;
    const preset = presets.find(p => p.id === loadedPresetId) || customPresets.find(p => p.id === loadedPresetId);
    if (!preset) return false;
    return tempSystemPrompt !== preset.systemPrompt || tempPromptTemplate !== preset.promptTemplate;
  };

  // Close the prompt configuration modal safely checking for changes
  const handleClosePromptConfig = () => {
    if (isWorkspaceModified) {
      setIsDiscardConfirmOpen(true);
    } else {
      setIsPromptConfigOpen(false);
    }
  };

  // Helper to delete a history item by ID (used by both inline and full modal viewer)
  const deleteHistoryItemById = (id: string) => {
    const itemToDelete = history.find(item => item.id === id);
    if (itemToDelete && itemToDelete.images) {
      itemToDelete.images.forEach(img => {
        if (img.id) {
          try {
            deleteStoredImage(img.id);
          } catch (err) {
            console.error("Failed to delete history image from IndexedDB:", err);
          }
        }
      });
    }
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    saveHistoryToLocalStorage(updated);
  };

  // Delete a specific history card
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  // Toggle favorite status for a specific history slot
  const handleToggleFavoriteHistoryItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = history.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    setHistory(updated);
    saveHistoryToLocalStorage(updated);
  };

  // Rename a specific history slot
  const handleRenameHistoryItem = (id: string, newName: string) => {
    const updated = history.map(item => {
      if (item.id === id) {
        return { ...item, name: newName };
      }
      return item;
    });
    setHistory(updated);
    saveHistoryToLocalStorage(updated);
  };

  // Open preset compare modal to compare history item prompts with active workspace
  const handleCompareHistoryItem = (item: HistoryItem) => {
    setTempSystemPrompt(systemPrompt);
    setTempPromptTemplate(promptTemplate);
    setComparePreset({
      id: item.id,
      name: item.name ? `History: ${item.name}` : item.presetLabel ? `History: ${item.presetLabel}` : "History Item",
      systemPrompt: item.systemPrompt || systemPrompt,
      promptTemplate: item.promptTemplate || promptTemplate,
    });
    setIsCompareOpen(true);
  };

  // Copy plain text output to clipboard
  const handleCopyOutput = () => {
    if (!generationResult) return;
    navigator.clipboard.writeText(generationResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger Gemini generation API
  const handleGeneratePrompt = async () => {
    setError(null);
    setIsLoading(true);
    setGenerationResult("");
    setThinkingResult("");
    setTokenUsage(null);
    setIsThinking(true);
    const startTime = performance.now();
    let accumulatedText = "";
    let accumulatedThought = "";
    let activeFilledPrompt = "";
    let capturedUsage: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number; cachedTokens?: number; thoughtTokens?: number } | null = null;

    try {
      const payload = {
        variables: inputs,
        images: uploadedImages.map(img => ({
          label: img.label,
          base64: img.base64,
          mimeType: img.mimeType,
          isFilesApi: img.isFilesApi,
          fileUri: img.fileUri,
        })),
        videos: uploadedVideos.map(vid => ({
          label: vid.label,
          base64: vid.base64,
          youtubeUrl: vid.youtubeUrl,
          mimeType: vid.mimeType,
          isFilesApi: vid.isFilesApi,
          fileUri: vid.fileUri,
          processingMode: vid.processingMode,
        })),
        systemPrompt,
        promptTemplate,
        model: selectedModel,
        thinkingLevel,
        temperature,
        maxTokens: maxTokens ? Number(maxTokens) : undefined,
        customApiKey: customApiKey ? customApiKey : undefined,
        responseMimeType: isStructuredOutput ? "application/json" : undefined,
        responseSchema: isStructuredOutput && responseSchema.trim() ? responseSchema.trim() : undefined,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation request failed");
      }

      if (!res.body) {
        throw new Error("Response body is not readable");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      const parseLine = (line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          const jsonStr = trimmedLine.slice(6).trim();
          if (!jsonStr) return;
          let data: any = null;
          try {
            data = JSON.parse(jsonStr);
          } catch (e: any) {
            console.error("Error parsing stream line JSON:", e, line);
            return;
          }

          if (data?.error) {
            let errorMsg = typeof data.error === "string" ? data.error : data.error?.message || JSON.stringify(data.error);
            // Unwrap stringified nested JSON if present
            for (let i = 0; i < 3; i++) {
              if (typeof errorMsg === "string" && (errorMsg.trim().startsWith("{") || errorMsg.trim().startsWith("["))) {
                try {
                  const parsed = JSON.parse(errorMsg);
                  if (parsed?.error?.message) errorMsg = parsed.error.message;
                  else if (parsed?.message) errorMsg = parsed.message;
                  else if (parsed?.error && typeof parsed.error === "string") errorMsg = parsed.error;
                  else break;
                } catch {
                  break;
                }
              }
            }

            if (
              errorMsg.includes("You do not have permission to access the File") ||
              errorMsg.includes("PERMISSION_DENIED") ||
              (errorMsg.includes("403") && errorMsg.includes("File"))
            ) {
              const fileMatch = errorMsg.match(/File\s+([a-zA-Z0-9_-]+)/);
              const fileId = fileMatch ? fileMatch[1] : "";
              errorMsg = `Gemini Files API Error: Access denied to uploaded file resource ${fileId ? `'${fileId}'` : ""}. Note: Files API assets are linked to the specific API key used during upload and automatically expire after 48 hours. If you switched API keys or the file expired, please re-upload or re-select an active file in the 'Files API Upload' modal.`;
            }

            throw new Error(errorMsg);
          }

          if (data.usage) {
            capturedUsage = data.usage;
            setTokenUsage(data.usage);
          }
          if (data.filledPrompt) {
            activeFilledPrompt = data.filledPrompt;
            setFilledPrompt(data.filledPrompt);
          }
          if (data.thought) {
            accumulatedThought += data.thought;
            setThinkingResult(accumulatedThought);
            setIsThinking(true);
          }
          if (data.text) {
            accumulatedText += data.text;
            setGenerationResult(accumulatedText);
            setIsThinking(false);
          }
        }
      };

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          // Store the last element back in the buffer since it could be a partial line
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            parseLine(line);
          }
        }
      }

      // Process any remaining data in the buffer after stream completes
      if (buffer) {
        parseLine(buffer);
      }

      const endTime = performance.now();
      setLastLatency((endTime - startTime) / 1000);

      // Save this outline to history list if we have text
      if (accumulatedText) {
        const historyImages = await Promise.all(
          uploadedImages.map(async (img, idx) => {
            // Decouple from the active session's image ID.
            const imgId = `hist-img-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
            if (!img.isFilesApi && img.base64 && !img.base64.startsWith("blob:")) {
              try {
                await saveStoredImage(imgId, img.base64);
              } catch (dbErr) {
                console.error("Failed to save history image to IndexedDB:", dbErr);
              }
            }
            const contentHash = img.contentHash || (img.base64 ? await computeContentHash(img.base64) : undefined);
            return {
              id: imgId,
              label: img.label,
              base64: "", // Strip to conserve localStorage space
              mimeType: img.mimeType,
              isFilesApi: img.isFilesApi,
              fileUri: img.fileUri,
              expirationTime: img.expirationTime,
              contentHash,
            };
          })
        );

        const historyVideos = uploadedVideos.map((vid, idx) => ({
          id: vid.id || `hist-vid-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          label: vid.label,
          mimeType: vid.mimeType,
          duration: vid.duration,
          youtubeUrl: vid.youtubeUrl,
          isYouTube: vid.isYouTube || Boolean(vid.youtubeUrl),
          isFilesApi: vid.isFilesApi,
          fileUri: vid.fileUri,
          expirationTime: vid.expirationTime,
          processingMode: vid.processingMode,
        }));

        const activeTemplateVars = new Set(extractVariables(promptTemplate));
        const cleanHistoryVariables: Record<string, string> = {};
        if (inputs["idea"] !== undefined) {
          cleanHistoryVariables["idea"] = inputs["idea"];
        }
        Object.keys(inputs).forEach(k => {
          if (activeTemplateVars.has(k)) {
            cleanHistoryVariables[k] = inputs[k];
          }
        });

        const matchingPreset = customPresets.find(
          p => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate
        ) || presets.find(
          p => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate
        );
        const activePresetLabel = matchingPreset ? matchingPreset.name : undefined;

        const newHistoryItem: HistoryItem = {
          id: `gen-${Date.now()}`,
          timestamp: new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          variables: cleanHistoryVariables,
          images: historyImages,
          videos: historyVideos,
          output: accumulatedText,
          thinkingResult: accumulatedThought || undefined,
          filledPrompt: activeFilledPrompt || filledPrompt,
          promptTemplate: promptTemplate,
          systemPrompt: systemPrompt,
          presetLabel: activePresetLabel,
          model: selectedModel,
          thinkingLevel: thinkingLevel,
          temperature: temperature,
          maxTokens: maxTokens || undefined,
          tokenUsage: capturedUsage || undefined,
          estimatedCost: capturedUsage ? calculateEstimatedCost(selectedModel, capturedUsage)?.formattedTotalCost : undefined,
        };

        setHistory(prev => {
          const updatedHistory = [newHistoryItem, ...prev];
          saveHistoryToLocalStorage(updatedHistory);
          return updatedHistory;
        });
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      let errMsg = err?.message || "An unexpected generation error occurred. Please try again.";
      for (let i = 0; i < 3; i++) {
        if (typeof errMsg === "string" && (errMsg.trim().startsWith("{") || errMsg.trim().startsWith("["))) {
          try {
            const parsed = JSON.parse(errMsg);
            if (parsed?.error?.message) errMsg = parsed.error.message;
            else if (parsed?.message) errMsg = parsed.message;
            else if (parsed?.error && typeof parsed.error === "string") errMsg = parsed.error;
            else break;
          } catch {
            break;
          }
        }
      }

      if (
        errMsg.includes("You do not have permission to access the File") ||
        errMsg.includes("PERMISSION_DENIED") ||
        (errMsg.includes("403") && errMsg.includes("File"))
      ) {
        const fileMatch = errMsg.match(/File\s+([a-zA-Z0-9_-]+)/);
        const fileId = fileMatch ? fileMatch[1] : "";
        errMsg = `Gemini Files API Error: Access denied to uploaded file resource ${fileId ? `'${fileId}'` : ""}. Note: Files API assets are linked to the specific API key used during upload and automatically expire after 48 hours. If you switched API keys or the file expired, please re-upload or re-select an active file in the 'Files API Upload' modal.`;
      }

      setError(errMsg);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  // Filter out system placeholders and main idea to render small parameters
  const displayVariables = variables.filter(
    v => v !== "visual_references" && v !== "cast" && v !== "idea"
  );

  // Get active API Key Label for footer
  const getActiveApiKeyLabel = () => {
    if (!customApiKey) return "Server Default";
    try {
      const savedKeysStr = localStorage.getItem("prompt_generator_custom_api_keys");
      const savedActiveId = localStorage.getItem("prompt_generator_active_api_key_id") || "";
      if (savedKeysStr) {
        const keysList = JSON.parse(savedKeysStr);
        const activeKeyObj = keysList.find((k: any) => k.id === savedActiveId || k.key === customApiKey);
        if (activeKeyObj) {
          return activeKeyObj.label;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return "Custom Key";
  };

  return (
    <div className="min-h-screen bg-[#F4F4F2] flex flex-col font-sans text-[#1A1A1A]" id="main-content">
      {/* Header */}
      <AppHeader
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenEngineConfig={() => setIsEngineConfigOpen(true)}
        onOpenPromptConfig={handleOpenPromptConfig}
        onClearSession={() => setIsClearConfirmOpen(true)}
        onOpenProjects={() => setIsProjectManagerOpen(true)}
        currentProjectName={activeProject?.name || "Main Workspace"}
        presets={presets}
        customPresets={customPresets}
        systemPrompt={systemPrompt}
        promptTemplate={promptTemplate}
        loadedPresetId={loadedPresetId}
        pinnedPresetIds={pinnedPresetIds}
        onSelectPreset={handleSelectQuickPreset}
        onTogglePinPreset={togglePinPreset}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        thinkingLevel={thinkingLevel}
        setThinkingLevel={setThinkingLevel}
        isStructuredOutput={isStructuredOutput}
        setIsStructuredOutput={setIsStructuredOutput}
      />

      {/* Main Container Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 border-b border-[#D1D1CF]" id="workspace-layout">
        
        {/* Left Pane: Composer / Inputs (7 cols of grid) */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col gap-8 bg-[#F4F4F2] lg:border-r lg:border-[#D1D1CF]" id="input-controls-column">
          
          {/* Section: Lab Manual & Quick-Start */}
          <LabManualSection
            isLabManualOpen={isLabManualOpen}
            toggleLabManual={toggleLabManual}
          />

          {/* Section: Main Idea / Core Objective */}
          <MainIdeaSection
            ideaValue={inputs["idea"] || ""}
            onIdeaChange={(val) => setInputs(prev => ({ ...prev, idea: val }))}
          />

          {/* Section: Visual Reference Assets */}
          <VisualAssetsSection
            isVisualAssetsOpen={isVisualAssetsOpen}
            onToggleVisualAssets={toggleVisualAssets}
            onOpenFilesApiModal={() => setIsFilesApiModalOpen(true)}
            onOpenYouTubeModal={() => setIsYouTubeModalOpen(true)}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            videoError={videoError}
            onClearVideoError={() => setVideoError(null)}
            storageWarningMessage={storageWarningMessage}
            onClearStorageWarning={() => setStorageWarningMessage(null)}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            uploadedImages={uploadedImages}
            handleUpdateLabel={handleUpdateLabel}
            handleDeleteImage={handleDeleteImage}
            uploadedVideos={uploadedVideos}
            handleUpdateVideoLabel={handleUpdateVideoLabel}
            handleDeleteVideo={handleDeleteVideo}
            activeModel={selectedModel}
            onToggleVideoProcessingMode={handleToggleVideoProcessingMode}
          />

          {/* Section: Template Variables / Parameters */}
          <ParameterInputsSection
            displayVariables={displayVariables}
            inputs={inputs}
            onInputChange={(v, val) => setInputs(prev => ({ ...prev, [v]: val }))}
          />

          {/* Action Trigger Button */}
          <div className="mt-2">
            <button
              onClick={handleGeneratePrompt}
              disabled={isLoading}
              className={`w-full h-14 uppercase tracking-[0.25em] font-bold text-xs transition-all active:scale-[0.98] cursor-pointer ${
                isLoading 
                  ? "bg-[#EAEAE8] text-[#888884] border border-[#D1D1CF] cursor-not-allowed"
                  : "bg-[#1A1A1A] text-white hover:bg-[#333] border border-[#1A1A1A]"
              }`}
              id="generate-prompt-btn"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Synthesizing Sequence...
                </span>
              ) : (
                "Generate Sequence"
              )}
            </button>
          </div>

        </div>

        {/* Right Pane: Outputs & History (5 cols of grid) */}
        <div className="lg:col-span-5 p-6 md:p-10 flex flex-col gap-8 bg-[#EAEAE8]" id="output-history-column">
          
          {/* Section: Local History */}
          <HistorySection
            history={history}
            isHistoryOpen={isHistoryOpen}
            toggleHistory={toggleHistory}
            historyTab={historyTab}
            setHistoryTab={setHistoryTab}
            setIsHistoryViewerOpen={setIsHistoryViewerOpen}
            setIsHistoryClearConfirmOpen={setIsHistoryClearConfirmOpen}
            setPendingLoadItem={setPendingLoadItem}
            onToggleFavorite={handleToggleFavoriteHistoryItem}
            onDeleteHistoryItem={handleDeleteHistoryItem}
          />

          {/* Section: Generation Result */}
          <GenerationResultView
            generationResult={generationResult}
            thinkingResult={thinkingResult}
            isThinking={isThinking}
            isLoading={isLoading}
            error={error}
            filledPrompt={filledPrompt}
            showCompiled={showCompiled}
            setShowCompiled={setShowCompiled}
            copied={copied}
            handleCopyOutput={handleCopyOutput}
            tokenUsage={tokenUsage}
            selectedModel={selectedModel}
            isStructuredOutput={isStructuredOutput}
          />

        </div>

      </div>

      {/* Footer Status Bar */}
      <FooterStatusBar
        selectedModel={selectedModel}
        thinkingLevel={thinkingLevel}
        temperature={temperature}
        activeApiKeyLabel={getActiveApiKeyLabel()}
        isStructuredOutput={isStructuredOutput}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
      />

      {/* Prompt Configuration Modal */}
      <PromptConfigModal
        isOpen={isPromptConfigOpen}
        onClose={handleClosePromptConfig}
        systemPrompt={systemPrompt}
        promptTemplate={promptTemplate}
        defaultSystemPrompt={defaultSystemPrompt}
        defaultPromptTemplate={defaultPromptTemplate}
        tempSystemPrompt={tempSystemPrompt}
        setTempSystemPrompt={setTempSystemPrompt}
        tempPromptTemplate={tempPromptTemplate}
        setTempPromptTemplate={setTempPromptTemplate}
        presets={presets}
        customPresets={customPresets}
        setCustomPresets={setCustomPresets}
        loadedPresetId={loadedPresetId}
        setLoadedPresetId={setLoadedPresetId}
        activeEditingPresetId={activeEditingPresetId}
        setActiveEditingPresetId={setActiveEditingPresetId}
        newPresetName={newPresetName}
        setNewPresetName={setNewPresetName}
        pinnedPresetIds={pinnedPresetIds}
        setPinnedPresetIds={setPinnedPresetIds}
        presetStatusBanner={presetStatusBanner}
        setPresetStatusBanner={setPresetStatusBanner}
        activeProjectName={activeProject?.name}
        onApply={handleApplyPromptConfig}
        onResetPrompts={handleResetPrompts}
        onSaveCustomPreset={handleSaveCustomPreset}
        onUpdateCustomPreset={handleUpdateCustomPreset}
        onDeleteCustomPreset={handleDeleteCustomPreset}
        onExportPresets={handleExportPresets}
        onImportPresets={handleImportPresets}
        onOpenComparePreset={(preset) => {
          setComparePreset(preset);
          setIsCompareOpen(true);
        }}
        extractVariables={extractVariables}
      />

      {/* Engine Controls Modal */}
      <EngineControlsModal
        isOpen={isEngineConfigOpen}
        onClose={() => setIsEngineConfigOpen(false)}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        thinkingLevel={thinkingLevel}
        setThinkingLevel={setThinkingLevel}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        isStructuredOutput={isStructuredOutput}
        setIsStructuredOutput={setIsStructuredOutput}
        responseSchema={responseSchema}
        setResponseSchema={setResponseSchema}
      />

      {/* Clear Session Confirmation Modal */}
      <ClearSessionConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearSession}
      />

      {/* Clear History Confirmation Modal */}
      <ClearHistoryConfirmModal
        isOpen={isHistoryClearConfirmOpen}
        onClose={() => setIsHistoryClearConfirmOpen(false)}
        history={history}
        onClearUnfavorited={handleClearUnfavoritedHistory}
        onClearAll={handleClearAllHistory}
      />

      {/* Load Workspace Confirmation Modal */}
      <LoadWorkspaceConfirmModal
        item={pendingLoadItem}
        onClose={() => setPendingLoadItem(null)}
        onConfirm={(item) => handleLoadHistoryItem(item)}
      />

      {/* Delete History Slot Confirmation Modal */}
      <DeleteHistoryConfirmModal
        pendingDeleteId={pendingDeleteId}
        history={history}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={(id) => deleteHistoryItemById(id)}
      />

      {/* Preset Import Confirmation Modal */}
      <PresetImportConfirmModal
        isOpen={isUrlImportConfirmOpen}
        urlPresetData={urlPresetData}
        urlImportPending={urlImportPending}
        urlImportError={urlImportError}
        urlImportSuccessMsg={urlImportSuccessMsg}
        applyToWorkspace={applyToWorkspace}
        onSetApplyToWorkspace={setApplyToWorkspace}
        importStrategy={importStrategy}
        onSetImportStrategy={onSetImportStrategy}
        onApply={handleApplyUrlPreset}
        onCancel={handleCancelUrlPreset}
        onDismissError={() => setUrlImportError(null)}
        onDismissSuccess={() => setUrlImportSuccessMsg(null)}
      />

      {/* Preset Replace Confirmation Modal */}
      <PresetReplaceConfirmModal
        isOpen={isPresetReplaceConfirmOpen}
        currentPresetName={
          loadedPresetId
            ? (presets.find((p) => p.id === loadedPresetId) || customPresets.find((p) => p.id === loadedPresetId))?.name || null
            : null
        }
        targetPreset={pendingQuickPreset}
        onClose={() => {
          setIsPresetReplaceConfirmOpen(false);
          setPendingQuickPreset(null);
        }}
        onConfirm={() => {
          if (pendingQuickPreset) {
            applyQuickPreset(pendingQuickPreset);
            setPendingQuickPreset(null);
          }
        }}
      />

      {/* Unsaved Changes Discard Confirmation Modal */}
      <DiscardChangesConfirmModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onDiscard={() => {
          setIsDiscardConfirmOpen(false);
          setIsPromptConfigOpen(false);
          const snap = initialPresetSnapshotRef.current;
          setLoadedPresetId(snap.loadedPresetId);
          setActiveEditingPresetId(snap.activeEditingPresetId);
          setNewPresetName(snap.newPresetName);
          try {
            if (snap.loadedPresetId) {
              localStorage.setItem("prompt_generator_loaded_preset_id", snap.loadedPresetId);
            } else {
              localStorage.removeItem("prompt_generator_loaded_preset_id");
            }
          } catch (e) {}
        }}
      />

      {/* Preset Compare Modal */}
      <PresetCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparePreset={comparePreset}
        tempSystemPrompt={tempSystemPrompt}
        tempPromptTemplate={tempPromptTemplate}
        onApplyPreset={(preset) => {
          setTempSystemPrompt(preset.systemPrompt);
          setTempPromptTemplate(preset.promptTemplate);

          setSystemPrompt(preset.systemPrompt);
          setPromptTemplate(preset.promptTemplate);
          const vars = extractVariables(preset.promptTemplate);
          setVariables(vars);

          setInputs((prev) => {
            const updated: Record<string, string> = {};
            if (prev["idea"] !== undefined) {
              updated["idea"] = prev["idea"];
            }
            vars.forEach((v) => {
              if (v !== "visual_references" && v !== "cast") {
                updated[v] = prev[v] !== undefined ? prev[v] : "";
              }
            });
            return updated;
          });

          localStorage.setItem("prompt_generator_system_prompt", preset.systemPrompt);
          localStorage.setItem("prompt_generator_prompt_template", preset.promptTemplate);

          const isSystem = presets.some((p) => p.id === preset.id);
          if (isSystem) {
            setActiveEditingPresetId(null);
            setNewPresetName("");
          } else {
            setActiveEditingPresetId(preset.id);
            setNewPresetName(preset.name);
          }

          setIsCompareOpen(false);
        }}
      />

      <AssetLibrarySidebar 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddImageToWorkspace={handleAddImageFromLibrary}
        onAssetLibraryUpdated={handleAssetLibraryUpdated}
        projectName={activeProject?.name}
      />

      <HistoryViewerModal
        isOpen={isHistoryViewerOpen}
        onClose={() => setIsHistoryViewerOpen(false)}
        history={history}
        onRenameHistoryItem={handleRenameHistoryItem}
        onDeleteHistoryItem={setPendingDeleteId}
        onLoadHistoryItem={setPendingLoadItem}
        onToggleFavoriteHistoryItem={handleToggleFavoriteHistoryItem}
        onImportHistory={handleImportHistory}
        onClearHistory={() => setIsHistoryClearConfirmOpen(true)}
        onCompareHistoryItem={handleCompareHistoryItem}
        projectName={activeProject?.name}
      />

      <AddYouTubeModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onAddYouTube={handleAddYouTubeVideo}
        nextIndex={uploadedVideos.filter(v => !v.mimeType?.startsWith("audio/") && !(v.mimeType?.startsWith("text/") || v.mimeType === "application/pdf")).length + 1}
      />

      <AddFilesApiModal
        isOpen={isFilesApiModalOpen}
        onClose={() => setIsFilesApiModalOpen(false)}
        onUploadSuccess={handleFilesApiUploadSuccess}
        customApiKey={customApiKey}
      />

      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        projects={projects}
        activeProject={activeProject}
        hasActiveSessionData={hasActiveSessionData}
        defaultSystemPrompt={defaultSystemPrompt}
        defaultPromptTemplate={defaultPromptTemplate}
        onSwitchProject={handleSwitchProject}
        onProjectsUpdated={handleProjectsUpdated}
      />

      <StorageUsageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onClearHistory={() => setIsHistoryClearConfirmOpen(true)}
      />
    </div>
  );
}
