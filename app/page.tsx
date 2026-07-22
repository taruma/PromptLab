"use client";

import React, { useState, useEffect, useRef } from "react";
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
  BookOpen,
  Search,
  GitCompare,
  AlertTriangle,
  Star
} from "lucide-react";

import AssetLibrarySidebar from "../components/AssetLibrarySidebar";
import VisualAssetCard from "../components/VisualAssetCard";
import EngineControlsModal from "../components/EngineControlsModal";
import HistoryViewerModal from "../components/HistoryViewerModal";
import HistorySection from "../components/HistorySection";
import {
  openDB,
  getStoredImage,
  saveStoredImage,
  deleteStoredImage
} from "../lib/indexeddb";
import {
  getRawUrl,
  compressImageToJpeg,
  computeLineDiff,
  alignDiffLines,
  type DiffLine,
  type SplitDiffRow
} from "../lib/utils";

interface UploadedImage {
  id: string;
  label: string;
  base64: string;
  mimeType: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  variables: Record<string, string>;
  images: { id?: string; label: string; base64: string; mimeType: string }[];
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

export default function PromptGeneratorPage() {
  // Config loaded from backend or local storage
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [promptTemplate, setPromptTemplate] = useState<string>("");
  const [variables, setVariables] = useState<string[]>([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // User input states
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  
  // Generation state
  const [generationResult, setGenerationResult] = useState<string>("");
  const [filledPrompt, setFilledPrompt] = useState<string>("");
  const [thinkingResult, setThinkingResult] = useState<string>("");
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
  const [storageWarningMessage, setStorageWarningMessage] = useState<string | null>(null);
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

  const truncateText = (text: string, maxLength: number = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Prompt Config Modal state
  const [isPromptConfigOpen, setIsPromptConfigOpen] = useState<boolean>(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState<string>("");
  const [tempPromptTemplate, setTempPromptTemplate] = useState<string>("");
  const [presets, setPresets] = useState<Array<{ id: string; name: string; systemPrompt: string; promptTemplate: string }>>([]);
  const [customPresets, setCustomPresets] = useState<Array<{ id: string; name: string; systemPrompt: string; promptTemplate: string }>>([]);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [isSystemPresetsOpen, setIsSystemPresetsOpen] = useState<boolean>(true);
  const [isCustomPresetsOpen, setIsCustomPresetsOpen] = useState<boolean>(true);
  const [isDiskDropdownOpen, setIsDiskDropdownOpen] = useState<boolean>(false);
  const [activeEditingPresetId, setActiveEditingPresetId] = useState<string | null>(null);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState<boolean>(false);
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);
  
  // Preset Search & Filter tabs
  const [presetSearch, setPresetSearch] = useState<string>("");
  const [activePresetTab, setActivePresetTab] = useState<"all" | "system" | "custom">("all");
  
  // Compare Preset states
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [comparePreset, setComparePreset] = useState<{ id: string; name: string; systemPrompt: string; promptTemplate: string } | null>(null);
  const [compareTab, setCompareTab] = useState<"system" | "template">("system");
  const [showOnlyChanges, setShowOnlyChanges] = useState<boolean>(true);
  const [diffViewMode, setDiffViewMode] = useState<"unified" | "split">("split");
  
  // Engine Controls states
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [thinkingLevel, setThinkingLevel] = useState<string>("MEDIUM");
  const [temperature, setTemperature] = useState<number>(1.0);
  const [maxTokens, setMaxTokens] = useState<string>("");
  
  // Engine Controls Modal states
  const [isEngineConfigOpen, setIsEngineConfigOpen] = useState<boolean>(false);
  
  // Custom User API Key Overrides
  const [customApiKey, setCustomApiKey] = useState<string>("");
  
  // Operational Telemetry states
  const [lastLatency, setLastLatency] = useState<number>(0);
  
  // URL Preset Import states
  const [urlPresetData, setUrlPresetData] = useState<{
    name: string;
    systemPrompt: string;
    promptTemplate: string;
    url: string;
  } | null>(null);
  const [isUrlImportConfirmOpen, setIsUrlImportConfirmOpen] = useState<boolean>(false);
  const [urlImportPending, setUrlImportPending] = useState<boolean>(false);
  const [urlImportError, setUrlImportError] = useState<string | null>(null);
  const [urlImportSuccessMsg, setUrlImportSuccessMsg] = useState<string | null>(null);
  const [preserveIdeaOnUrlImport, setPreserveIdeaOnUrlImport] = useState<boolean>(true);
  const [clearSessionOnUrlImport, setClearSessionOnUrlImport] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Helper: extract variables dynamically on the client
  const extractVariables = (templateText: string): string[] => {
    const matches = Array.from(templateText.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g));
    const vars = new Set<string>();
    for (const match of matches) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  };

  // Fetch prompt configuration from backend/localStorage on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/prompt-config");
        const data = await res.json();
        
        if (res.ok) {
          if (data.presets) {
            setPresets(data.presets);
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
                  if (img.base64) {
                    // Backward compatibility: base64 exists in localStorage. Migrate to IndexedDB.
                    try {
                      await saveStoredImage(img.id, img.base64);
                    } catch (err) {
                      console.error("Failed to migrate existing localStorage image to IndexedDB:", err);
                    }
                    return img;
                  } else {
                    // Fetch from IndexedDB
                    try {
                      const dbBase64 = await getStoredImage(img.id);
                      if (dbBase64) {
                        return { ...img, base64: dbBase64 };
                      }
                    } catch (err) {
                      console.error(`Failed to load image ${img.id} from IndexedDB:`, err);
                    }
                    return img;
                  }
                })
              );
              setUploadedImages(resolvedImages);
            }
          } catch (e) {
            console.error("Failed to parse/load saved images", e);
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

      setTimeout(() => {
        if (savedLabManualOpen !== null) {
          setIsLabManualOpen(savedLabManualOpen === "true");
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
      }, 0);
    } catch (e) {
      console.error("Failed to parse configurations on mount", e);
    }

    // Load local storage history safely on mount (client-side only) and sanitize dead parameters
    try {
      const savedHistory = localStorage.getItem("prompt_generator_history");
      if (savedHistory) {
        setTimeout(() => {
          const parsedHistory: HistoryItem[] = JSON.parse(savedHistory);
          let wasModified = false;

          const cleanedHistory = parsedHistory.map((item) => {
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

          if (wasModified) {
            try {
              localStorage.setItem("prompt_generator_history", JSON.stringify(cleanedHistory));
            } catch (err) {
              console.error("Failed to save cleaned history back to localStorage", err);
            }
          }

          setHistory(cleanedHistory);
        }, 0);
      }
    } catch (e) {
      console.error("Failed to parse generation history", e);
    }
  }, []);

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

  // Save active generation results to localStorage whenever they change
  useEffect(() => {
    if (isConfigLoaded) {
      localStorage.setItem("prompt_generator_generation_result", generationResult);
      localStorage.setItem("prompt_generator_thinking_result", thinkingResult);
      localStorage.setItem("prompt_generator_filled_prompt", filledPrompt);
    }
  }, [generationResult, thinkingResult, filledPrompt, isConfigLoaded]);

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

  // Helper: cleans the URL params
  const cleanUrlParam = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("presetUrl");
      url.searchParams.delete("configUrl");
      url.searchParams.delete("preset");
      url.searchParams.delete("config");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  // Fetch preset from URL query parameter if present
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("presetUrl") || params.get("configUrl") || params.get("preset") || params.get("config");

    if (urlParam) {
      let targetUrl = decodeURIComponent(urlParam);
      targetUrl = getRawUrl(targetUrl);

      async function fetchPresetFromUrl() {
        setUrlImportPending(true);
        setUrlImportError(null);
        try {
          const res = await fetch(targetUrl);
          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }
          const data = await res.json();
          
          if (data.systemPrompt !== undefined && data.promptTemplate !== undefined) {
            setUrlPresetData({
              name: data.name || "Imported URL Preset",
              systemPrompt: data.systemPrompt,
              promptTemplate: data.promptTemplate,
              url: targetUrl
            });
            setIsUrlImportConfirmOpen(true);
          } else {
            throw new Error("Invalid preset format. The JSON must contain 'systemPrompt' and 'promptTemplate' fields.");
          }
        } catch (err: any) {
          console.error("Failed to fetch preset from URL:", err);
          setUrlImportError(`Failed to load preset from URL: ${err.message}. Ensure the link is valid and the server supports CORS.`);
          cleanUrlParam();
        } finally {
          setUrlImportPending(false);
        }
      }

      // Small timeout to let initial state/config load complete
      setTimeout(() => {
        fetchPresetFromUrl();
      }, 500);
    }
  }, []);

  const handleApplyUrlPreset = () => {
    if (!urlPresetData) return;

    setSystemPrompt(urlPresetData.systemPrompt);
    setPromptTemplate(urlPresetData.promptTemplate);
    const vars = extractVariables(urlPresetData.promptTemplate);
    setVariables(vars);

    localStorage.setItem("prompt_generator_system_prompt", urlPresetData.systemPrompt);
    localStorage.setItem("prompt_generator_prompt_template", urlPresetData.promptTemplate);

    setInputs(prev => {
      const updatedInputs: Record<string, string> = {};
      if (preserveIdeaOnUrlImport && prev["idea"]) {
        updatedInputs["idea"] = prev["idea"];
      }

      if (!clearSessionOnUrlImport) {
        vars.forEach(v => {
          if (v !== "visual_references" && v !== "cast" && v !== "idea") {
            if (prev[v] !== undefined) {
              updatedInputs[v] = prev[v];
            } else {
              updatedInputs[v] = "";
            }
          }
        });
      } else {
        vars.forEach(v => {
          if (v !== "visual_references" && v !== "cast" && v !== "idea") {
            updatedInputs[v] = "";
          }
        });
      }
      return updatedInputs;
    });

    if (clearSessionOnUrlImport) {
      setUploadedImages([]);
      setGenerationResult("");
      setFilledPrompt("");
      setThinkingResult("");
      setIsThinking(false);
    }

    setUrlImportSuccessMsg(`Successfully imported and compiled: "${urlPresetData.name}"`);
    setTimeout(() => {
      setUrlImportSuccessMsg(null);
    }, 4000);

    setIsUrlImportConfirmOpen(false);
    setUrlPresetData(null);
    cleanUrlParam();
  };

  const handleCancelUrlPreset = () => {
    setIsUrlImportConfirmOpen(false);
    setUrlPresetData(null);
    cleanUrlParam();
  };

  // Process selected image files
  const handleImageFiles = async (files: FileList) => {
    const validImages = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validImages.length === 0) return;

    const newUploaded: UploadedImage[] = [];
    
    for (let i = 0; i < validImages.length; i++) {
      const file = validImages[i];
      try {
        const base64 = await compressImageToJpeg(file, 0.9);
        // Suggest a nice default label based on filename or numbering
        const rawName = file.name.split(".")[0];
        const cleanLabel = rawName
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase());

        const imgId = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
        try {
          await saveStoredImage(imgId, base64);
        } catch (dbErr) {
          console.error("Failed to save image to IndexedDB:", dbErr);
        }

        newUploaded.push({
          id: imgId,
          label: cleanLabel,
          base64: base64,
          mimeType: "image/jpeg",
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
      await handleImageFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleImageFiles(e.target.files);
    }
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
    try {
      await saveStoredImage(imgId, base64);
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
    // Restore system prompt & prompt template if saved in history item
    if (item.promptTemplate) {
      setPromptTemplate(item.promptTemplate);
      localStorage.setItem("prompt_generator_prompt_template", item.promptTemplate);
      const vars = extractVariables(item.promptTemplate);
      setVariables(vars);
    }
    if (item.systemPrompt) {
      setSystemPrompt(item.systemPrompt);
      localStorage.setItem("prompt_generator_system_prompt", item.systemPrompt);
    }

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

        return {
          id: newImgId,
          label: img.label,
          base64: base64 || "",
          mimeType: img.mimeType,
        };
      })
    );
    
    setUploadedImages(loadedImages);
    setGenerationResult(item.output);
    setFilledPrompt(item.filledPrompt);
    setThinkingResult("");
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

    // Delete current images from IndexedDB to avoid storage clutter
    uploadedImages.forEach(img => {
      try {
        deleteStoredImage(img.id);
      } catch (err) {
        console.error("Failed to clean up image on session clear:", err);
      }
    });

    setUploadedImages([]);
    setGenerationResult("");
    setFilledPrompt("");
    setThinkingResult("");
    setIsThinking(false);
    setError(null);
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
    localStorage.removeItem("prompt_generator_history");
  };

  // Import new history items and persist to local storage
  const handleImportHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("prompt_generator_history", JSON.stringify(newHistory));
    } catch (err) {
      console.error("Failed to save imported history to local storage:", err);
    }
  };

  // We manage engine controls configuration via the external EngineControlsModal component.

  // Open the configuration modal
  const handleOpenPromptConfig = () => {
    setTempSystemPrompt(systemPrompt);
    setTempPromptTemplate(promptTemplate);
    
    // Check if current prompts match any existing custom preset or system preset
    const matchingCustom = customPresets.find(
      p => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate
    );
    const matchingSys = presets.find(
      p => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate
    );

    if (matchingCustom) {
      setActiveEditingPresetId(matchingCustom.id);
      setNewPresetName(matchingCustom.name);
      setLoadedPresetId(matchingCustom.id);
    } else if (matchingSys) {
      setActiveEditingPresetId(null);
      setNewPresetName("");
      setLoadedPresetId(matchingSys.id);
    } else {
      setActiveEditingPresetId(null);
      setNewPresetName("");
      setLoadedPresetId(null);
    }
    
    setIsPromptConfigOpen(true);
  };

  // Revert/Re-fetch the default prompt files inside the configuration modal
  const handleRestoreDefaultPrompts = async () => {
    try {
      const res = await fetch("/api/prompt-config");
      const data = await res.json();
      if (res.ok) {
        setTempSystemPrompt(data.systemPrompt || "");
        setTempPromptTemplate(data.promptTemplate || "");
      } else {
        alert("Failed to load original templates: " + data.error);
      }
    } catch (err: any) {
      alert("Error loading originals: " + err.message);
    }
  };

  // Export current modal prompt configuration as JSON file
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify({
        name: "Custom Workspace Preset",
        systemPrompt: tempSystemPrompt,
        promptTemplate: tempPromptTemplate
      }, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', 'prompt_lab_preset.json');
      linkElement.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Failed to export configuration: " + e.message);
    }
  };

  // Import custom prompt configuration from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.systemPrompt !== undefined && parsed.promptTemplate !== undefined) {
          setTempSystemPrompt(parsed.systemPrompt || "");
          setTempPromptTemplate(parsed.promptTemplate || "");
          alert(`Successfully loaded preset: "${parsed.name || 'Untitled'}"`);
        } else {
          alert("Invalid file format. The JSON must contain 'systemPrompt' and 'promptTemplate' fields.");
        }
      } catch (err: any) {
        alert("Failed to parse JSON file: " + err.message);
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
    const newPreset = {
      id: newId,
      name: newPresetName.trim(),
      systemPrompt: tempSystemPrompt,
      promptTemplate: tempPromptTemplate
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(updated));
    setActiveEditingPresetId(newId);
  };

  // Update an existing custom preset in local storage
  const handleUpdateCustomPreset = () => {
    if (!activeEditingPresetId) return;
    if (!newPresetName.trim()) {
      alert("Please enter a name for your custom preset.");
      return;
    }
    const updated = customPresets.map(p => {
      if (p.id === activeEditingPresetId) {
        return {
          ...p,
          name: newPresetName.trim(),
          systemPrompt: tempSystemPrompt,
          promptTemplate: tempPromptTemplate
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
    localStorage.setItem("prompt_generator_history", JSON.stringify(updated));
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
    localStorage.setItem("prompt_generator_history", JSON.stringify(updated));
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
    localStorage.setItem("prompt_generator_history", JSON.stringify(updated));
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
    setIsThinking(true);
    const startTime = performance.now();
    let accumulatedText = "";
    let accumulatedThought = "";
    let activeFilledPrompt = "";

    try {
      const payload = {
        variables: inputs,
        images: uploadedImages.map(img => ({
          label: img.label,
          base64: img.base64,
          mimeType: img.mimeType,
        })),
        systemPrompt,
        promptTemplate,
        model: selectedModel,
        thinkingLevel,
        temperature,
        maxTokens: maxTokens ? Number(maxTokens) : undefined,
        customApiKey: customApiKey ? customApiKey : undefined,
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
          if (jsonStr) {
            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                throw new Error(data.error);
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
            } catch (e: any) {
              console.error("Error parsing stream line:", e, line);
            }
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
            // This ensures that deleting the active session image card or overwriting it
            // will never break the historic reference in IndexedDB.
            const imgId = `hist-img-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
            try {
              await saveStoredImage(imgId, img.base64);
            } catch (dbErr) {
              console.error("Failed to save history image to IndexedDB:", dbErr);
            }
            return {
              id: imgId,
              label: img.label,
              base64: "", // Strip to conserve localStorage space
              mimeType: img.mimeType,
            };
          })
        );

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
          }),
          variables: cleanHistoryVariables,
          images: historyImages,
          output: accumulatedText,
          filledPrompt: activeFilledPrompt || filledPrompt,
          promptTemplate: promptTemplate,
          systemPrompt: systemPrompt,
          presetLabel: activePresetLabel,
          model: selectedModel,
          thinkingLevel: thinkingLevel,
          temperature: temperature,
          maxTokens: maxTokens || undefined,
        };

        setHistory(prev => {
          const updatedHistory = [newHistoryItem, ...prev];
          localStorage.setItem("prompt_generator_history", JSON.stringify(updatedHistory));
          return updatedHistory;
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected generation error occurred. Please try again.");
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
      <header className="h-20 border-b border-[#D1D1CF] px-4 md:px-10 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-30" id="app-header">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Image 
                src="/logo_promptlab.png" 
                alt="PromptLab Logo" 
                width={28} 
                height={28} 
                className="object-contain invert"
                referrerPolicy="no-referrer"
              />
            </div>
            PromptLab
          </h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-white"
            title="Open Asset Library & Casting Bank"
            id="open-library-header-btn"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
            Asset Library
          </button>
          <button
            onClick={() => setIsEngineConfigOpen(true)}
            className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-white"
            title="Configure Engine Model & Parameters"
            id="engine-controls-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Engine Controls
          </button>
          <button
            onClick={handleOpenPromptConfig}
            className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-white"
            title="Configure System Prompt & Template"
            id="configure-prompts-btn"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            Configure Prompts
          </button>
          <button
            onClick={() => setIsClearConfirmOpen(true)}
            className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Clear all active inputs, uploaded files, and generation results"
            id="clear-session-btn"
          >
            Clear Session
          </button>
        </div>
      </header>

      {/* Main Container Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 border-b border-[#D1D1CF]" id="workspace-layout">
        
        {/* Left Pane: Composer / Inputs (7 cols of grid) */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col gap-8 bg-[#F4F4F2] lg:border-r lg:border-[#D1D1CF]" id="input-controls-column">
          
          {/* Section: Lab Manual & Quick-Start */}
          <section className="flex flex-col shrink-0" id="lab-manual-panel">
            <div 
              onClick={toggleLabManual}
              className="flex justify-between items-center mb-1 cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Lab Manual & Quick-Start Guide
                </h2>
                <span className="text-[#888884] group-hover:text-[#1A1A1A] transition-colors">
                  {isLabManualOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 transform rotate-180 transition-transform" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                  )}
                </span>
              </div>
            </div>

            {isLabManualOpen && (
              <div className="bg-white border border-[#D1D1CF] p-4 md:p-5 flex flex-col gap-4 text-xs" id="lab-manual-content">
                {/* 1-4 Step instructions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">1</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Configure Template</span>
                      <p className="text-[#888884] text-[11px] leading-relaxed">
                        Click <strong className="text-[#1A1A1A]">Configure Prompts</strong> in the top header to define your custom System Instructions and curly-brace variables (e.g. <code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">{"{{ variable }}"}</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">2</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Input Active Values</span>
                      <p className="text-[#888884] text-[11px] leading-relaxed">
                        Fill in your core concept under <strong className="text-[#1A1A1A]">Main Objective / Idea</strong>. Dynamic form inputs are automatically generated below for all other custom placeholders.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">3</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Upload References</span>
                      <p className="text-[#888884] text-[11px] leading-relaxed">
                        Upload reference images to map characters, backgrounds, or assets to sequential <code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">@imageX</code> variables used in your prompt templates.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">4</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Synthesize Sequence</span>
                      <p className="text-[#888884] text-[11px] leading-relaxed">
                        Choose your model and parameters in <strong className="text-[#1A1A1A]">Engine Controls</strong>, then hit <strong className="text-[#1A1A1A]">Generate Sequence</strong> to stream real-time results and thinking logs.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer link to Repository */}
                <div className="border-t border-[#D1D1CF] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F4F4F2]/50 p-2.5 border-dashed">
                  <span className="text-[10px] text-[#888884] font-medium leading-relaxed">
                    Looking for custom templates, default presets, or raw project files?
                  </span>
                  <a 
                    href="https://github.com/taruma/PromptLab" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-none self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Open Docs Repo
                  </a>
                </div>
              </div>
            )}
          </section>

          {/* Section: Main Idea / Core Objective */}
          <section className="flex flex-col gap-3" id="main-idea-section">
            <div className="flex justify-between items-end">
              <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
                Main Objective / Idea
              </h2>
              <span className="text-[9px] font-mono text-[#888884]">
                {"{{ idea }}"}
              </span>
            </div>

            <label htmlFor="variable-idea" className="sr-only">Core Creative Concept</label>
            <textarea
              id="variable-idea"
              rows={4}
              value={inputs["idea"] || ""}
              onChange={(e) => setInputs(prev => ({ ...prev, idea: e.target.value }))}
              placeholder="Describe the core creative scene requirements, conflict, or central idea here..."
              className="w-full bg-white border border-[#D1D1CF] p-4 text-sm leading-relaxed outline-none focus:border-[#1A1A1A] transition-colors resize-y min-h-[120px] rounded-none font-sans text-[#1A1A1A] placeholder-stone-400"
            />
          </section>

          {/* Section: Visual Reference Assets */}
          <section className="flex flex-col gap-3" id="images-reference-section">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
                Visual Assets & Casting Maps
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="px-2 py-0.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A]"
                  id="browse-library-btn"
                >
                  <FolderOpen className="w-3 h-3 text-[#1a1a1a]" />
                  Browse Library
                </button>
                <span className="text-[9px] font-mono text-[#888884]">
                  {"{{ visual_references }}"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#888884] font-medium tracking-tight -mt-1 leading-normal">
              Upload images to serve as reference models. The system will name-map each asset (e.g. @image1) and inject references cleanly into your templates. All files are automatically compressed to high-quality (90%) JPEG format to conserve browser local storage.
            </p>

            {storageWarningMessage && (
              <div className="bg-[#FFFBEB] border border-[#F59E0B] p-3 flex justify-between items-start text-[10px] text-[#B45309] font-mono leading-relaxed rounded-none" id="storage-quota-warning">
                <div className="flex gap-2">
                  <span className="font-bold">⚠️ NOTE:</span>
                  <span>{storageWarningMessage}</span>
                </div>
                <button 
                  onClick={() => setStorageWarningMessage(null)}
                  className="font-bold hover:text-[#78350F] px-1 ml-2 shrink-0 cursor-pointer"
                >
                  [X]
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mt-1">
              {/* Drag and Drop Uploader */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`min-h-[140px] border-2 border-dashed flex flex-col items-center justify-center p-4 gap-2 cursor-pointer transition-all ${
                  dragActive 
                    ? "border-[#1A1A1A] bg-[#EAEAE8]" 
                    : "border-[#D1D1CF] bg-white hover:border-[#1A1A1A]"
                }`}
                id="upload-dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-file-uploader"
                />
                <span className="text-xl text-[#888884] font-bold">+</span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]">Upload File</span>
                <span className="text-[8px] text-[#888884] font-mono uppercase tracking-tight">Drag / Select</span>
              </div>

              {/* Active Asset Cards */}
              {uploadedImages.map((img, index) => (
                <VisualAssetCard
                  key={img.id}
                  img={img}
                  index={index}
                  onUpdateLabel={handleUpdateLabel}
                  onDeleteImage={handleDeleteImage}
                />
              ))}
            </div>
          </section>

          {/* Section: Template Variables / Parameters */}
          <section className="flex flex-col gap-3" id="parameter-inputs-card">
            <div className="flex justify-between items-end">
              <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
                Template Specifications
              </h2>
              <span className="text-[9px] font-mono text-[#888884]">
                Parameters Form
              </span>
            </div>

            {displayVariables.length === 0 ? (
              <div className="bg-white border border-[#D1D1CF] p-6 text-center">
                <HelpCircle className="w-6 h-6 text-[#888884] mx-auto mb-1.5" />
                <p className="text-xs text-[#888884] uppercase tracking-wider font-bold">Mapping dynamic variables...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-[#D1D1CF] p-6" id="parameter-inputs-container">
                {displayVariables.map((v) => {
                  const label = v.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={v} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-baseline">
                        <label htmlFor={`input-${v}`} className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]">
                          {label}
                        </label>
                        <span className="text-[8px] font-mono text-[#888884]">{"{{"} {v} {"}}"}</span>
                      </div>
                      <input
                        id={`input-${v}`}
                        type="text"
                        value={inputs[v] || ""}
                        onChange={(e) => setInputs(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Provide ${label.toLowerCase()}...`}
                        className="bg-white border border-[#D1D1CF] p-3 text-xs outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Action Trigger Button */}
          <div className="mt-2">
            <button
              onClick={handleGeneratePrompt}
              disabled={isLoading || !inputs["idea"]}
              className={`w-full h-14 uppercase tracking-[0.25em] font-bold text-xs transition-all active:scale-[0.98] cursor-pointer ${
                isLoading 
                  ? "bg-[#EAEAE8] text-[#888884] border border-[#D1D1CF] cursor-not-allowed"
                  : !inputs["idea"]
                    ? "bg-[#EAEAE8] border border-[#D1D1CF] text-[#888884] cursor-not-allowed"
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
            {!inputs["idea"] && (
              <p className="text-[9px] text-[#888884] text-center mt-2 font-mono uppercase tracking-wider">
                * Specify Core Idea first to unlock generation
              </p>
            )}
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
          <section className="flex-1 flex flex-col min-h-[420px]" id="output-panel">
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
                  Generation Result
                </h2>
                {generationResult && (
                  <span className="text-[8px] font-mono text-[#888884] bg-white border border-[#D1D1CF] px-1.5 py-0.5 font-bold" id="char-counter">
                    {generationResult.length} CHARS
                  </span>
                )}
              </div>
              
              {generationResult && (
                <button
                  onClick={handleCopyOutput}
                  className="px-3 py-1 bg-white border border-[#D1D1CF] text-[9px] uppercase font-bold tracking-widest hover:bg-[#F4F4F2] transition-colors cursor-pointer"
                  id="copy-btn"
                >
                  {copied ? (
                    <span className="text-emerald-700">{"// Copied"}</span>
                  ) : (
                    "Copy Raw Text"
                  )}
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 mb-4 bg-white border-l-4 border-red-500 border-y border-r border-[#D1D1CF] text-xs text-red-600 flex items-start gap-2">
                <span className="font-bold">{"// Error:"}</span>
                <span>{error}</span>
              </div>
            )}

            {/* Model Thinking / Reasoning Box */}
            {(thinkingResult || (isLoading && isThinking)) && (
              <div className="mb-4 bg-[#F4F4F2] border border-dashed border-[#D1D1CF] p-4 flex flex-col gap-2 transition-all" id="thinking-process-block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-[#888884]">
                    <span className={`w-2 h-2 rounded-full ${isThinking ? 'bg-amber-500 animate-pulse' : 'bg-stone-400'} inline-block`} />
                    Engine Reasoning Trace
                  </div>
                  <span className="text-[8px] font-mono text-[#888884]">
                    {isThinking ? "PROCESSING" : "COMPLETED"}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#555] leading-relaxed max-h-[140px] overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                  {thinkingResult || (
                    <span className="italic text-[#888884]">Engine is formulating reasoning path...</span>
                  )}
                </div>
              </div>
            )}

            {/* Main Display Area */}
            <div className="flex-1 bg-white border border-[#D1D1CF] p-6 flex flex-col justify-between overflow-hidden shadow-inner min-h-[300px]">
              {isLoading && !generationResult && !thinkingResult ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#888884]" />
                  <p className="text-xs uppercase tracking-widest font-bold text-[#888884]">Establishing Stream Connection...</p>
                </div>
              ) : generationResult || thinkingResult ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-[#1A1A1A] font-serif whitespace-pre-wrap custom-scrollbar">
                    {generationResult || (
                      <span className="italic text-[#888884] text-xs font-sans">
                        Reasoning trace active. Waiting for generation output...
                      </span>
                    )}
                  </div>
                  <div className="pt-3 border-t border-[#D1D1CF]/40 mt-3 flex items-center justify-between text-[8px] text-[#888884] font-mono uppercase tracking-wider">
                    <span>MIME: TEXT/PLAIN ONLY</span>
                    <span className="flex items-center gap-1.5">
                      {isLoading && !isThinking && (
                        <span className="flex items-center gap-1 text-[8px] text-emerald-600 font-bold uppercase tracking-wider font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          Streaming...
                        </span>
                      )}
                      <span>No Markdown Output</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 p-4 text-[#888884]">
                  <FileText className="w-8 h-8 text-[#D1D1CF] mb-3" />
                  <p className="text-xs font-serif italic max-w-[280px]">
                    The generated sequence will appear here as plain text once you hit generate. It combines your visual references with custom variables.
                  </p>
                </div>
              )}
            </div>

            {/* Collapsible specs */}
            {filledPrompt && (
              <div className="mt-4 border-t border-[#D1D1CF] pt-3" id="accordion-compiled-prompt">
                <button
                  onClick={() => setShowCompiled(!showCompiled)}
                  className="flex items-center justify-between w-full text-[9px] uppercase tracking-wider font-bold text-[#888884] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  id="toggle-compiled-btn"
                >
                  <span className="flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5" />
                    {showCompiled ? "Hide compiled instructions" : "Show compiled prompt specs"}
                  </span>
                  <span>{showCompiled ? "[-]" : "[+]"}</span>
                </button>
                {showCompiled && (
                  <div className="mt-2.5 p-3.5 bg-white border border-[#D1D1CF] max-h-32 overflow-y-auto text-[10px] font-mono text-[#555] whitespace-pre-wrap leading-relaxed custom-scrollbar">
                    {filledPrompt}
                  </div>
                )}
              </div>
            )}
          </section>

        </div>

      </div>

      {/* Footer Status Bar */}
      <footer className="h-10 px-4 md:px-10 bg-[#1A1A1A] text-white flex items-center justify-between text-[9px] font-mono shrink-0">
        <div className="flex flex-wrap gap-x-6 gap-y-1 uppercase">
          <span>Engine: {selectedModel.toUpperCase()}</span>
          <span>Reasoning: {thinkingLevel}</span>
          <span>Temp: {temperature.toFixed(1)}</span>
          <span>Key: {getActiveApiKeyLabel().toUpperCase()}</span>
        </div>
        <div className="uppercase opacity-50 tracking-wider">PromptLab by Taruma Sakti</div>
      </footer>

      {/* Prompt Configuration Modal */}
      {isPromptConfigOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6" id="prompt-config-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-5xl h-[85vh] flex flex-col justify-between shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-16 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#888884]" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans">
                  System Prompt & Template Editor
                </h3>
              </div>
              <button
                onClick={handleClosePromptConfig}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#F4F4F2]/50">
              
              {/* Left Sidebar: Presets & Disk Management */}
              <div className="w-full md:w-64 border-r border-[#D1D1CF] bg-white p-5 flex flex-col gap-5 shrink-0 overflow-y-auto">
                  
                  {/* Workspace Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDiskDropdownOpen(!isDiskDropdownOpen)}
                      className="w-full px-3 py-2 bg-[#F4F4F2] hover:bg-[#EAEAE8] text-[#1A1A1A] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-between gap-1.5"
                    >
                      <span className="flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                        Config Options
                      </span>
                      <ChevronDown className={`w-3 h-3 text-[#888884] transition-transform duration-200 ${isDiskDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {isDiskDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsDiskDropdownOpen(false)} 
                        />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-[#1A1A1A] shadow-lg z-20 flex flex-col">
                          {/* Hidden Input */}
                          <input 
                            type="file" 
                            ref={jsonInputRef} 
                            onChange={(e) => {
                              handleImportJSON(e);
                              setIsDiskDropdownOpen(false);
                            }} 
                            accept=".json" 
                            className="hidden" 
                          />
                          <button
                            onClick={() => jsonInputRef.current?.click()}
                            className="w-full px-4 py-2.5 hover:bg-[#F4F4F2] text-left text-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b border-[#D1D1CF]"
                          >
                            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#888884]" />
                            Import JSON
                          </button>
                          
                          <button
                            onClick={() => {
                              handleExportJSON();
                              setIsDiskDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 hover:bg-[#F4F4F2] text-left text-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b border-[#D1D1CF]"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0 text-[#888884]" />
                            Export JSON
                          </button>
                          
                          <button
                            onClick={() => {
                              handleRestoreDefaultPrompts();
                              setIsDiskDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 hover:bg-red-50 text-red-700 text-left text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5 shrink-0 text-red-500" />
                            Reset to TXT Files
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <hr className="border-[#D1D1CF]" />

                  {/* Preset Search & Filter */}
                  <div className="flex flex-col gap-2">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-[#888884] absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search presets..."
                        value={presetSearch}
                        onChange={(e) => setPresetSearch(e.target.value)}
                        className="w-full bg-[#F4F4F2] border border-[#D1D1CF] pl-8 pr-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 border border-[#D1D1CF] bg-[#F4F4F2] p-0.5">
                      <button
                        onClick={() => setActivePresetTab("all")}
                        className={`text-[8px] font-black uppercase tracking-wider py-1 text-center transition-all cursor-pointer ${
                          activePresetTab === "all" 
                            ? "bg-white text-[#1A1A1A] border border-[#D1D1CF]/30 shadow-xs" 
                            : "text-[#888884] hover:text-[#1A1A1A]"
                        }`}
                      >
                        All ({presets.length + customPresets.length})
                      </button>
                      <button
                        onClick={() => setActivePresetTab("system")}
                        className={`text-[8px] font-black uppercase tracking-wider py-1 text-center transition-all cursor-pointer ${
                          activePresetTab === "system" 
                            ? "bg-white text-[#1A1A1A] border border-[#D1D1CF]/30 shadow-xs" 
                            : "text-[#888884] hover:text-[#1A1A1A]"
                        }`}
                      >
                        Sys ({presets.length})
                      </button>
                      <button
                        onClick={() => setActivePresetTab("custom")}
                        className={`text-[8px] font-black uppercase tracking-wider py-1 text-center transition-all cursor-pointer ${
                          activePresetTab === "custom" 
                            ? "bg-white text-[#1A1A1A] border border-[#D1D1CF]/30 shadow-xs" 
                            : "text-[#888884] hover:text-[#1A1A1A]"
                        }`}
                      >
                        User ({customPresets.length})
                      </button>
                    </div>
                  </div>

                  <hr className="border-[#D1D1CF]" />

                  {/* System Presets */}
                  {(activePresetTab === "all" || activePresetTab === "system") && (
                    <div>
                      <button 
                        onClick={() => {
                          const newVal = !isSystemPresetsOpen;
                          setIsSystemPresetsOpen(newVal);
                          localStorage.setItem("prompt_generator_sys_presets_open", String(newVal));
                        }}
                        className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] mb-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>System Presets</span>
                          {presetSearch && (
                            <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5 font-mono font-bold">
                              {presets.filter(p => p.name.toLowerCase().includes(presetSearch.toLowerCase())).length}/{presets.length}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#888884] transition-transform duration-200 ${isSystemPresetsOpen ? "rotate-180" : ""}`} />
                      </button>
                      
                      {isSystemPresetsOpen && (
                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5 transition-all">
                          {presets
                            .filter(p => p.name.toLowerCase().includes(presetSearch.toLowerCase()))
                            .map((preset) => {
                              const isLoaded = loadedPresetId === preset.id;
                              const isModified = isLoaded && (tempSystemPrompt !== preset.systemPrompt || tempPromptTemplate !== preset.promptTemplate);
                              return (
                                <div 
                                  key={preset.id}
                                  className={`w-full border flex items-center justify-between transition-all text-[10px] font-bold uppercase tracking-wider ${
                                    isLoaded 
                                      ? isModified
                                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
                                        : "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                                      : "bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setTempSystemPrompt(preset.systemPrompt);
                                      setTempPromptTemplate(preset.promptTemplate);
                                      setActiveEditingPresetId(null);
                                      setNewPresetName("");
                                      setLoadedPresetId(preset.id);
                                    }}
                                    className="flex-1 text-left px-3 py-2 cursor-pointer truncate flex items-center gap-1.5 justify-between"
                                  >
                                    <span className="truncate">{preset.name}</span>
                                    {isModified && (
                                      <span className="text-[8px] bg-amber-200 text-amber-800 px-1 py-0.5 rounded-none font-mono font-bold shrink-0 animate-pulse">
                                        [EDITED]
                                      </span>
                                    )}
                                    {isLoaded && !isModified && (
                                      <span className="text-[8px] bg-emerald-700 text-white px-1 py-0.5 rounded-none font-mono font-bold shrink-0">
                                        [ACTIVE]
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setComparePreset(preset);
                                      setIsCompareOpen(true);
                                      setCompareTab("system");
                                    }}
                                    className={`p-2 transition-all cursor-pointer border-l ${
                                      isLoaded ? isModified ? "border-amber-500/30 hover:bg-amber-100 text-amber-700" : "border-[#333] hover:bg-[#333] text-amber-400" : "border-[#D1D1CF] hover:bg-white text-[#888884] hover:text-[#1A1A1A]"
                                    }`}
                                    title="Compare differences with active workspace"
                                  >
                                    <GitCompare className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          {presets.filter(p => p.name.toLowerCase().includes(presetSearch.toLowerCase())).length === 0 && (
                            <div className="text-[9px] text-[#888884] font-mono italic p-2 border border-[#D1D1CF] bg-[#F4F4F2] uppercase text-center">
                              No Matches Found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Presets */}
                  {(activePresetTab === "all" || activePresetTab === "custom") && (
                    <div>
                      <button 
                        onClick={() => {
                          const newVal = !isCustomPresetsOpen;
                          setIsCustomPresetsOpen(newVal);
                          localStorage.setItem("prompt_generator_custom_presets_open", String(newVal));
                        }}
                        className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] mb-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Your Presets</span>
                          <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5 font-mono">
                            {presetSearch 
                              ? `${customPresets.filter(p => p.name.toLowerCase().includes(presetSearch.toLowerCase())).length}/${customPresets.length}` 
                              : customPresets.length
                            }
                          </span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#888884] transition-transform duration-200 ${isCustomPresetsOpen ? "rotate-180" : ""}`} />
                      </button>
                      
                      {isCustomPresetsOpen && (
                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5 transition-all">
                          {customPresets
                            .filter(p => p.name.toLowerCase().includes(presetSearch.toLowerCase()))
                            .map((preset) => {
                              const isLoaded = loadedPresetId === preset.id;
                              const isModified = isLoaded && (tempSystemPrompt !== preset.systemPrompt || tempPromptTemplate !== preset.promptTemplate);
                              return (
                                <div 
                                  key={preset.id}
                                  className={`w-full border flex items-center justify-between transition-all text-[10px] font-bold uppercase tracking-wider ${
                                    isLoaded 
                                      ? isModified
                                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
                                        : "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                                      : "bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setTempSystemPrompt(preset.systemPrompt);
                                      setTempPromptTemplate(preset.promptTemplate);
                                      setActiveEditingPresetId(preset.id);
                                      setNewPresetName(preset.name);
                                      setLoadedPresetId(preset.id);
                                    }}
                                    className="flex-1 text-left px-3 py-2 cursor-pointer truncate flex items-center gap-1.5 justify-between"
                                  >
                                    <span className="truncate">{preset.name}</span>
                                    {isModified && (
                                      <span className="text-[8px] bg-amber-200 text-amber-800 px-1 py-0.5 rounded-none font-mono font-bold shrink-0 animate-pulse">
                                        [EDITED]
                                      </span>
                                    )}
                                    {isLoaded && !isModified && (
                                      <span className="text-[8px] bg-emerald-700 text-white px-1 py-0.5 rounded-none font-mono font-bold shrink-0">
                                        [ACTIVE]
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setComparePreset(preset);
                                      setIsCompareOpen(true);
                                      setCompareTab("system");
                                    }}
                                    className={`p-2 transition-all cursor-pointer border-l ${
                                      isLoaded ? isModified ? "border-amber-500/30 hover:bg-amber-100 text-amber-700" : "border-[#333] hover:bg-[#333] text-amber-400" : "border-[#D1D1CF] hover:bg-white text-[#888884] hover:text-[#1A1A1A]"
                                    }`}
                                    title="Compare differences with active workspace"
                                  >
                                    <GitCompare className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                                    className={`p-2 transition-all cursor-pointer border-l hover:text-red-500 ${
                                      isLoaded ? isModified ? "border-amber-500/30 hover:bg-amber-100" : "border-[#333] hover:bg-[#333]" : "border-[#D1D1CF] hover:bg-white"
                                    }`}
                                    title="Delete preset"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          {customPresets.filter(p => p.name.toLowerCase().includes(presetSearch.toLowerCase())).length === 0 && (
                            <div className="text-[9px] text-[#888884] font-mono italic p-2 border border-[#D1D1CF] bg-[#F4F4F2] uppercase text-center">
                              No Matches Found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <hr className="border-[#D1D1CF]" />

                  {/* Save current as custom preset */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]">
                        {activeEditingPresetId ? "Preset Workspace" : "Save Current As Preset"}
                      </h4>
                      {activeEditingPresetId && (
                        <button
                          onClick={() => {
                            setActiveEditingPresetId(null);
                            setNewPresetName("");
                            setLoadedPresetId(null);
                          }}
                          className="text-[9px] font-mono font-bold text-red-500 hover:text-red-700 uppercase cursor-pointer"
                          title="Deselect loaded preset to start a new workspace"
                        >
                          [Deselect]
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-preset-name" className="sr-only">New Preset Name</label>
                      <input
                        id="new-preset-name"
                        type="text"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="Preset name (e.g. Scriptwriter)"
                        className="w-full bg-white border border-[#D1D1CF] p-2 text-[10px] outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
                      />
                      {activeEditingPresetId ? (
                        <div className="flex flex-col gap-1.5">
                          {isPresetModified() && (
                            <p className="text-[8px] text-amber-700 font-mono font-black uppercase leading-tight tracking-wider animate-pulse flex items-center gap-1">
                              <span>● PRESET HAS UNSAVED CHANGES</span>
                            </p>
                          )}
                          <button
                            onClick={handleUpdateCustomPreset}
                            className={`w-full py-2 text-white text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                              isPresetModified()
                                ? "bg-amber-600 hover:bg-amber-700 border-amber-600 shadow-sm animate-pulse"
                                : "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            Update Loaded Preset
                          </button>
                          <button
                            onClick={handleSaveCustomPreset}
                            className="w-full py-1.5 bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            Save As New Preset
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {!activeEditingPresetId && isPresetModified() && (
                            <p className="text-[8px] text-amber-700 font-mono font-black uppercase leading-tight tracking-wider flex items-center gap-1">
                              <span>● MODIFIED SYSTEM PRESET (SAVE NEW)</span>
                            </p>
                          )}
                          <button
                            onClick={handleSaveCustomPreset}
                            className="w-full py-2 bg-[#1A1A1A] text-white hover:bg-[#333] border border-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            Save Preset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

              </div>

              {/* Right Editors Space */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
                
                {/* Alert/Tip header */}
                <div className="bg-white border border-[#D1D1CF] p-3 text-[10px] leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-[#555]">
                    <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px] font-mono">Variables Parsing Engine:</span>
                    <p>
                      Use double curly-braces <code className="font-mono bg-[#F4F4F2] px-1 text-[#1A1A1A] font-bold text-[9px]">{"{{ name }}"}</code> in your template. PromptLab generates input composers for them instantly on save.
                    </p>
                  </div>
                </div>

                {/* Workspace code grids */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-0">
                  
                  {/* System Prompt block */}
                  <div className="flex flex-col gap-2 min-h-[250px]">
                    <label htmlFor="modal-system-prompt" className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
                      System Instructions (Expert Behavior & Constraints)
                    </label>
                    <textarea
                      id="modal-system-prompt"
                      value={tempSystemPrompt}
                      onChange={(e) => setTempSystemPrompt(e.target.value)}
                      placeholder="Define the core persona and rules for the Gemini model..."
                      className="flex-1 w-full bg-white border border-[#D1D1CF] p-4 text-xs font-mono leading-relaxed outline-none focus:border-[#1A1A1A] resize-none text-[#1A1A1A] placeholder-stone-400 custom-scrollbar h-full"
                    />
                  </div>

                  {/* Prompt Template block */}
                  <div className="flex flex-col gap-2 min-h-[250px]">
                    <label htmlFor="modal-prompt-template" className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
                      Prompt Template (Prompt block with placeholders)
                    </label>
                    <textarea
                      id="modal-prompt-template"
                      value={tempPromptTemplate}
                      onChange={(e) => setTempPromptTemplate(e.target.value)}
                      placeholder="Build custom prompts using {{ variable_name }} templates..."
                      className="flex-1 w-full bg-white border border-[#D1D1CF] p-4 text-xs font-mono leading-relaxed outline-none focus:border-[#1A1A1A] resize-none text-[#1A1A1A] placeholder-stone-400 custom-scrollbar h-full"
                    />
                  </div>

                </div>

                {/* Active Dynamic Variables parsed */}
                <div className="bg-white border border-[#D1D1CF] p-3 flex flex-col gap-1.5 shrink-0">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">
                    Live Parsed Template Variables ({extractVariables(tempPromptTemplate).filter(v => v !== "visual_references" && v !== "cast" && v !== "idea").length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractVariables(tempPromptTemplate)
                      .filter(v => v !== "visual_references" && v !== "cast" && v !== "idea")
                      .map(v => (
                        <span key={v} className="text-[9px] bg-[#EAEAE8] text-[#1A1A1A] px-2 py-0.5 font-mono border border-[#D1D1CF] uppercase">
                          {v}
                        </span>
                      ))}
                    {extractVariables(tempPromptTemplate).filter(v => v !== "visual_references" && v !== "cast" && v !== "idea").length === 0 && (
                      <span className="text-[9px] text-[#888884] italic font-mono uppercase">
                        No variables detected
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClosePromptConfig}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyPromptConfig}
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
                >
                  Apply & Compile Template
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

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
      />

      {/* Clear Session Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="clear-confirm-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-red-600">
                  Confirm Clear Session
                </h3>
              </div>
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
              <p>
                Are you sure you want to clear your active session? This action will:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-[10px] text-[#1A1A1A] uppercase">
                <li>Clear all input values & parameters</li>
                <li>Remove all uploaded visual reference assets</li>
                <li>Erase current generation result and reasoning trace</li>
              </ul>
              <div className="bg-white border border-[#D1D1CF] p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500">
                <span className="font-bold uppercase tracking-wider font-mono">Note:</span> Your customized System Prompts, Prompt Templates, and presets will remain completely intact.
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleClearSession();
                    setIsClearConfirmOpen(false);
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-red-600"
                >
                  Clear Active Session
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {isHistoryClearConfirmOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="clear-history-confirm-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-red-600">
                  Confirm Clear History
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryClearConfirmOpen(false)}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
              <p>
                Are you sure you want to clear all items in your local session history? This action will:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-[10px] text-[#1A1A1A] uppercase">
                <li>Delete all saved history items</li>
                <li>Permanently purge all history-referenced image files from IndexedDB</li>
                <li>Free up local browser storage</li>
              </ul>
              <div className="bg-white border border-[#D1D1CF] p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500">
                <span className="font-bold uppercase tracking-wider font-mono">Warning:</span> This operation is completely irreversible.
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsHistoryClearConfirmOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleClearAllHistory();
                    setIsHistoryClearConfirmOpen(false);
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-red-600"
                >
                  Clear All History
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Load Workspace Confirmation Modal */}
      {pendingLoadItem && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" id="load-history-confirm-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative rounded-none animate-scale-up">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#1A1A1A]" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
                  Confirm Load Workspace
                </h3>
              </div>
              <button
                onClick={() => setPendingLoadItem(null)}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
              <p>
                Are you sure you want to load the workspace preset <strong className="text-[#1A1A1A] uppercase">“{truncateText(pendingLoadItem.name || pendingLoadItem.variables["idea"] || "Untitled Outline", 100)}”</strong>? 
              </p>
              <p className="text-[#1A1A1A] font-bold">
                This action will overwrite your current active session, including:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-[10px] text-[#1A1A1A] uppercase">
                <li>All current text inputs & variable parameters</li>
                <li>All active visual reference cards & character maps</li>
                <li>The active generation result and reasoning logs</li>
              </ul>
              <div className="bg-white border border-[#D1D1CF] p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500">
                <span className="font-bold uppercase tracking-wider font-mono">Note:</span> Your customized System Instructions, Prompt Templates, and saved custom presets will remain completely untouched.
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPendingLoadItem(null)}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleLoadHistoryItem(pendingLoadItem);
                    setPendingLoadItem(null);
                  }}
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
                >
                  Load Workspace
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete History Slot Confirmation Modal */}
      {pendingDeleteId && (() => {
        const itemToDelete = history.find(h => h.id === pendingDeleteId);
        return (
          <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" id="delete-history-item-confirm-modal">
            <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative rounded-none animate-scale-up">
              
              {/* Modal Header */}
              <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider font-sans text-red-600">
                    Confirm Delete Slot
                  </h3>
                </div>
                <button
                  onClick={() => setPendingDeleteId(null)}
                  className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  [ESC] CLOSE
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
                <p>
                  Are you sure you want to delete the history slot <strong className="text-[#1A1A1A] uppercase">“{truncateText(itemToDelete?.name || itemToDelete?.variables["idea"] || "Untitled Outline", 100)}”</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 p-3.5 text-[10px] text-red-800 leading-normal border-l-4 border-l-red-500 font-mono uppercase tracking-wider font-black leading-snug">
                  <span>⚠️ Warning: This will permanently delete this generation record and all its associated image assets from IndexedDB. This operation is completely irreversible.</span>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteHistoryItemById(pendingDeleteId);
                      setPendingDeleteId(null);
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-red-600"
                  >
                    Delete Record
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* URL Preset Import Confirmation Modal */}
      {isUrlImportConfirmOpen && urlPresetData && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="url-import-confirm-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-xl flex flex-col justify-between shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
                  Preset URL Import Detected
                </h3>
              </div>
              <button
                onClick={handleCancelUrlPreset}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-5 text-xs leading-relaxed text-[#555]">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">Preset Name:</span>
                <span className="text-sm font-black uppercase tracking-tight text-[#1A1A1A]">
                  {urlPresetData.name}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">Source URL:</span>
                <div className="font-mono text-[9px] bg-white border border-[#D1D1CF] p-2.5 text-[#1A1A1A] break-all max-h-20 overflow-y-auto">
                  {urlPresetData.url}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 text-[10px] text-amber-900 leading-normal border-l-4 border-l-amber-500">
                <span className="font-bold uppercase tracking-wider font-mono">Warning:</span> Loading this URL preset will replace your currently configured System Prompt and Prompt Template.
              </div>

              {/* Integration Options */}
              <div className="flex flex-col gap-3 pt-2 border-t border-[#D1D1CF]/60">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]">
                  Import Options
                </h4>

                <div className="flex flex-col gap-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preserveIdeaOnUrlImport}
                      onChange={(e) => setPreserveIdeaOnUrlImport(e.target.checked)}
                      className="mt-0.5 accent-[#1A1A1A] w-3.5 h-3.5 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#1A1A1A] uppercase">Preserve Core Idea</span>
                      <span className="text-[9px] text-[#888884] leading-normal font-mono uppercase">Keep your current &quot;Main Objective / Idea&quot; text</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={clearSessionOnUrlImport}
                      onChange={(e) => setClearSessionOnUrlImport(e.target.checked)}
                      className="mt-0.5 accent-[#1A1A1A] w-3.5 h-3.5 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#1A1A1A] uppercase">Reset Active Session</span>
                      <span className="text-[9px] text-[#888884] leading-normal font-mono uppercase">Clear all other active variables, uploaded assets, and outputs</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelUrlPreset}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white"
                >
                  Cancel / Ignore
                </button>
                <button
                  onClick={handleApplyUrlPreset}
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
                >
                  Import & Apply Preset
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* URL Preset Import Loading Indicator */}
      {urlImportPending && (
        <div className="fixed inset-0 bg-[#1a1a1a]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D1CF] p-6 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-[#888884]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
              Fetching Remote Preset...
            </span>
          </div>
        </div>
      )}

      {/* URL Import Error Dialog */}
      {urlImportError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-red-200 shadow-2xl p-4 flex flex-col gap-2 animate-fade-in" id="url-import-error-toast">
          <div className="flex items-center justify-between border-b border-red-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5 font-sans">
              [!] Import Failed
            </span>
            <button 
              onClick={() => setUrlImportError(null)}
              className="text-stone-400 hover:text-[#1A1A1A] font-mono text-[9px] font-bold uppercase"
            >
              [Dismiss]
            </button>
          </div>
          <p className="text-[11px] text-[#555] leading-relaxed">
            {urlImportError}
          </p>
          <p className="text-[9px] text-[#888884] font-mono uppercase">
            Check the URL query parameters or server configuration
          </p>
        </div>
      )}

      {/* Unsaved Changes Discard Confirmation Modal */}
      {isDiscardConfirmOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="discard-confirm-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative rounded-none animate-scale-up">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-amber-700">
                  Unsaved Changes Detected
                </h3>
              </div>
              <button
                onClick={() => setIsDiscardConfirmOpen(false)}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
              <p className="font-medium text-[#1A1A1A]">
                You have edited your prompt configurations (System Instructions or Prompt Template) inside the editor. Closing now will discard these modifications completely.
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500 font-mono uppercase font-black tracking-wider leading-snug">
                <span>⚠️ DISCARD IS COMPLETELY IRREVERSIBLE.</span>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDiscardConfirmOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => {
                    setIsDiscardConfirmOpen(false);
                    setIsPromptConfigOpen(false);
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-amber-600"
                >
                  Discard Changes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Preset Compare Modal */}
      {isCompareOpen && comparePreset && (() => {
        const oldText = compareTab === "system" ? tempSystemPrompt : tempPromptTemplate;
        const newText = compareTab === "system" ? comparePreset.systemPrompt : comparePreset.promptTemplate;
        const diffLines = computeLineDiff(oldText, newText);
        
        const additionsCount = diffLines.filter(l => l.type === "added").length;
        const deletionsCount = diffLines.filter(l => l.type === "removed").length;
        const hasDifferences = additionsCount > 0 || deletionsCount > 0;

        // Compute Git-style context-aware lines to display for Unified view
        let displayLines: Array<
          | { type: "line"; line: DiffLine; index: number }
          | { type: "skipped"; count: number; startIndex: number; endIndex: number }
        > = [];

        if (showOnlyChanges && hasDifferences) {
          const contextWindow = 3; // Number of unchanged context lines to preserve around a change
          const len = diffLines.length;
          const visible = new Array(len).fill(false);
          
          // Mark all lines that are added/removed + context window surrounding them as visible
          for (let c = 0; c < len; c++) {
            if (diffLines[c].type !== "unchanged") {
              const start = Math.max(0, c - contextWindow);
              const end = Math.min(len - 1, c + contextWindow);
              for (let v = start; v <= end; v++) {
                visible[v] = true;
              }
            }
          }
          
          // Construct the segmented line array
          let idx = 0;
          while (idx < len) {
            if (visible[idx]) {
              displayLines.push({ type: "line", line: diffLines[idx], index: idx });
              idx++;
            } else {
              const startSkip = idx;
              while (idx < len && !visible[idx]) {
                idx++;
              }
              const endSkip = idx - 1;
              const count = endSkip - startSkip + 1;
              displayLines.push({
                type: "skipped",
                count,
                startIndex: startSkip,
                endIndex: endSkip
              });
            }
          }
        } else {
          displayLines = diffLines.map((line, idx) => ({ type: "line", line, index: idx }));
        }

        // Compute Git-style context-aware display rows for Split view
        let displaySplitRows: Array<
          | { type: "row"; row: SplitDiffRow; index: number }
          | { type: "skipped"; count: number; startIndex: number; endIndex: number }
        > = [];

        const allSplitRows = alignDiffLines(diffLines);

        if (showOnlyChanges && hasDifferences) {
          const contextWindow = 3;
          const len = allSplitRows.length;
          const visible = new Array(len).fill(false);
          
          // Mark rows that contain changes (added or removed) and their neighbors visible
          for (let c = 0; c < len; c++) {
            const row = allSplitRows[c];
            const isChange = 
              (row.left && row.left.type === "removed") || 
              (row.right && row.right.type === "added");
              
            if (isChange) {
              const start = Math.max(0, c - contextWindow);
              const end = Math.min(len - 1, c + contextWindow);
              for (let v = start; v <= end; v++) {
                visible[v] = true;
              }
            }
          }
          
          // Segment the rows
          let idx = 0;
          while (idx < len) {
            if (visible[idx]) {
              displaySplitRows.push({ type: "row", row: allSplitRows[idx], index: idx });
              idx++;
            } else {
              const startSkip = idx;
              while (idx < len && !visible[idx]) {
                idx++;
              }
              const endSkip = idx - 1;
              const count = endSkip - startSkip + 1;
              displaySplitRows.push({
                type: "skipped",
                count,
                startIndex: startSkip,
                endIndex: endSkip
              });
            }
          }
        } else {
          displaySplitRows = allSplitRows.map((row, idx) => ({ type: "row", row, index: idx }));
        }
        
        return (
          <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="preset-compare-modal">
            <div className="bg-white border border-[#D1D1CF] w-full max-w-6xl h-[85vh] md:h-[80vh] flex flex-col shadow-2xl relative rounded-none overflow-hidden">
              
              {/* Modal Header */}
              <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
                    Compare: {comparePreset.name}
                  </span>
                </div>
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  [ESC] CLOSE
                </button>
              </div>

              {/* Modal Subtitle / Toggles bar */}
              <div className="border-b border-[#D1D1CF] bg-[#F4F4F2]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">Preset Diff Inspector</span>
                  <span className="text-[9px] text-[#888884] uppercase font-mono">
                    Showing differences of active workspace vs target preset configuration
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCompareTab("system")}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      compareTab === "system"
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                    }`}
                  >
                    System Instructions
                  </button>
                  <button
                    onClick={() => setCompareTab("template")}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      compareTab === "template"
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                    }`}
                  >
                    Prompt Template
                  </button>
                </div>
              </div>

              {/* Stats & Overview info */}
              <div className="px-6 py-3 border-b border-[#D1D1CF] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888884] font-mono">Changes in this file:</span>
                  <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 uppercase">
                      +{additionsCount} additions
                    </span>
                    <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 uppercase">
                      -{deletionsCount} deletions
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* View mode toggle */}
                  <div className="flex items-center gap-1 border border-[#D1D1CF] p-0.5 bg-[#FAF9F6]">
                    <button
                      onClick={() => setDiffViewMode("split")}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        diffViewMode === "split"
                          ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                          : "text-[#888884] hover:text-[#1A1A1A]"
                      }`}
                    >
                      Split View
                    </button>
                    <button
                      onClick={() => setDiffViewMode("unified")}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        diffViewMode === "unified"
                          ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                          : "text-[#888884] hover:text-[#1A1A1A]"
                      }`}
                    >
                      Unified View
                    </button>
                  </div>

                  {/* Filter toggle */}
                  <div className="flex items-center gap-1 border border-[#D1D1CF] p-0.5 bg-[#FAF9F6]">
                    <button
                      onClick={() => setShowOnlyChanges(true)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        showOnlyChanges
                          ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                          : "text-[#888884] hover:text-[#1A1A1A]"
                      }`}
                      title="Collapse unchanged lines with a few lines of context (Git-style)"
                    >
                      Changes Only
                    </button>
                    <button
                      onClick={() => setShowOnlyChanges(false)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        !showOnlyChanges
                          ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                          : "text-[#888884] hover:text-[#1A1A1A]"
                      }`}
                      title="Display the entire file including all unmodified lines"
                    >
                      Full File
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Headers if Split View */}
              {diffViewMode === "split" && hasDifferences && diffLines.length > 0 && (
                <div className="grid grid-cols-2 divide-x divide-[#D1D1CF] border-b border-[#D1D1CF] bg-[#F4F4F2] shrink-0 font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                  <div className="py-2 px-6 flex items-center justify-between">
                    <span>Active Workspace (Original)</span>
                  </div>
                  <div className="py-2 px-6 flex items-center justify-between">
                    <span>Preset Target ({comparePreset.name})</span>
                  </div>
                </div>
              )}

              {/* Diff Output Codeblock - Scrollable */}
              <div className="flex-1 p-6 bg-[#FAF9F6] flex flex-col min-h-0">
                <div className="flex-1 border border-[#D1D1CF] bg-white flex flex-col overflow-y-auto custom-scrollbar min-h-0">
                  {diffLines.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#888884] font-mono uppercase text-[10px] italic">
                      This file is completely empty.
                    </div>
                  ) : !hasDifferences ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-[#888884] font-mono uppercase text-[10px] gap-2">
                      <span className="font-bold text-[#1A1A1A] text-xs">Configurations are Identical</span>
                      <span>No additions or deletions detected between active workspace and target preset.</span>
                      <button
                        onClick={() => setShowOnlyChanges(false)}
                        className="mt-2 px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold uppercase text-[9px] tracking-wider transition-all cursor-pointer"
                      >
                        Inspect Full File
                      </button>
                    </div>
                  ) : diffViewMode === "split" ? (
                    /* SPLIT SIDE-BY-SIDE VIEW */
                    <div className="flex-1 flex flex-col divide-y divide-[#EAEAE8]">
                      {displaySplitRows.map((item, idx) => {
                        if (item.type === "skipped") {
                          return (
                            <div 
                              key={`skipped-split-${idx}`}
                              className="bg-[#F4F4F2]/50 text-[#888884] font-mono text-[10px] uppercase font-bold py-3 px-6 flex items-center justify-between border-y border-y-[#D1D1CF]/30 select-none shrink-0"
                            >
                              <span className="tracking-wide">••• Skipped {item.count} unchanged lines •••</span>
                              <button
                                onClick={() => setShowOnlyChanges(false)}
                                className="text-[9px] font-bold tracking-wider underline hover:text-[#1A1A1A] cursor-pointer font-sans"
                              >
                                SHOW FULL FILE
                              </button>
                            </div>
                          );
                        }

                        const { left, right } = item.row;
                        
                        // Left styling
                        let leftBg = "bg-white text-[#1A1A1A]";
                        let leftSymbol = " ";
                        if (left && left.type === "removed") {
                          leftBg = "bg-red-50/70 text-red-800 border-l-4 border-l-red-500 font-semibold";
                          leftSymbol = "-";
                        } else if (!left) {
                          leftBg = "bg-[#FAF9F6]/40 text-stone-300 select-none";
                        }

                        // Right styling
                        let rightBg = "bg-white text-[#1A1A1A]";
                        let rightSymbol = " ";
                        if (right && right.type === "added") {
                          rightBg = "bg-emerald-50/70 text-emerald-800 border-l-4 border-l-emerald-500 font-semibold";
                          rightSymbol = "+";
                        } else if (!right) {
                          rightBg = "bg-[#FAF9F6]/40 text-stone-300 select-none";
                        }

                        return (
                          <div key={`split-row-${idx}`} className="grid grid-cols-2 divide-x divide-[#EAEAE8] min-h-[28px] hover:bg-stone-50/30 transition-colors shrink-0">
                            {/* Left cell (Active Workspace) */}
                            <div className={`flex items-start font-mono text-[11px] py-1.5 overflow-hidden ${leftBg}`}>
                              {/* Line number */}
                              <div className="w-12 select-none shrink-0 text-right pr-3 text-[9px] text-[#888884] border-r border-[#EAEAE8]/80 mr-2 flex justify-end font-mono">
                                {left?.lineNumber || ""}
                              </div>
                              {/* Symbol */}
                              <span className="w-4 select-none shrink-0 font-bold font-mono text-center opacity-70">
                                {leftSymbol}
                              </span>
                              {/* Content */}
                              <pre className="flex-1 whitespace-pre-wrap break-all pr-3 font-mono select-text">
                                {left?.value ?? ""}
                              </pre>
                            </div>

                            {/* Right cell (Target Preset) */}
                            <div className={`flex items-start font-mono text-[11px] py-1.5 overflow-hidden ${rightBg}`}>
                              {/* Line number */}
                              <div className="w-12 select-none shrink-0 text-right pr-3 text-[9px] text-[#888884] border-r border-[#EAEAE8]/80 mr-2 flex justify-end font-mono">
                                {right?.lineNumber || ""}
                              </div>
                              {/* Symbol */}
                              <span className="w-4 select-none shrink-0 font-bold font-mono text-center opacity-70">
                                {rightSymbol}
                              </span>
                              {/* Content */}
                              <pre className="flex-1 whitespace-pre-wrap break-all pr-3 font-mono select-text">
                                {right?.value ?? ""}
                              </pre>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* UNIFIED INLINE VIEW */
                    <div className="flex-1 flex flex-col divide-y divide-[#EAEAE8]">
                      {displayLines.map((item, idx) => {
                        if (item.type === "skipped") {
                          return (
                            <div 
                              key={`skipped-${idx}`}
                              className="bg-[#F4F4F2]/50 text-[#888884] font-mono text-[10px] uppercase font-bold py-3 px-6 flex items-center justify-between border-l-4 border-l-[#D1D1CF]/60 select-none shrink-0"
                            >
                              <span className="tracking-wide">••• Skipped {item.count} unchanged lines •••</span>
                              <button
                                onClick={() => setShowOnlyChanges(false)}
                                className="text-[9px] font-bold tracking-wider underline hover:text-[#1A1A1A] cursor-pointer font-sans"
                              >
                                SHOW FULL FILE
                              </button>
                            </div>
                          );
                        }

                        const line = item.line;
                        let lineClass = "bg-white text-[#1A1A1A] border-l-4 border-l-transparent";
                        let symbol = " ";
                        if (line.type === "added") {
                          lineClass = "bg-emerald-50/70 text-emerald-800 border-l-4 border-l-emerald-500 font-semibold";
                          symbol = "+";
                        } else if (line.type === "removed") {
                          lineClass = "bg-red-50/70 text-red-800 border-l-4 border-l-red-500 font-semibold";
                          symbol = "-";
                        }

                        return (
                          <div 
                            key={`line-${idx}`} 
                            className={`flex items-start font-mono text-[11px] leading-relaxed py-1.5 transition-colors hover:bg-stone-50 shrink-0 ${lineClass}`}
                          >
                            {/* Line numbers */}
                            <div className="w-14 select-none shrink-0 text-right pr-4 text-[9px] text-[#888884] border-r border-[#EAEAE8]/80 mr-3 flex justify-end gap-1 font-mono">
                              <span className="w-5 inline-block">{line.lineNumberA || ""}</span>
                              <span className="w-5 inline-block text-[#b1b1ae]">{line.lineNumberB || ""}</span>
                            </div>
                            
                            {/* Diff Symbol */}
                            <span className="w-4 select-none shrink-0 font-bold font-mono text-center opacity-70">
                              {symbol}
                            </span>

                            {/* Line Content */}
                            <pre className="flex-1 whitespace-pre-wrap break-all pr-4 font-mono select-text">
                              {line.value || " "}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white"
                >
                  Close Diff
                </button>
                
                <button
                  onClick={() => {
                    setTempSystemPrompt(comparePreset.systemPrompt);
                    setTempPromptTemplate(comparePreset.promptTemplate);
                    
                    const isSystem = presets.some(p => p.id === comparePreset.id);
                    if (isSystem) {
                      setActiveEditingPresetId(null);
                      setNewPresetName("");
                    } else {
                      setActiveEditingPresetId(comparePreset.id);
                      setNewPresetName(comparePreset.name);
                    }
                    
                    setIsCompareOpen(false);
                  }}
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
                >
                  Apply & Load Preset
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* URL Import Success Toast */}
      {urlImportSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-emerald-200 shadow-2xl p-4 flex flex-col gap-1.5 animate-fade-in" id="url-import-success-toast">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 font-sans">
              [✓] Preset Applied
            </span>
            <button 
              onClick={() => setUrlImportSuccessMsg(null)}
              className="text-stone-400 hover:text-[#1A1A1A] font-mono text-[9px] font-bold uppercase"
            >
              [Dismiss]
            </button>
          </div>
          <p className="text-[11px] text-[#1A1A1A] font-medium leading-relaxed">
            {urlImportSuccessMsg}
          </p>
        </div>
      )}

      <AssetLibrarySidebar 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddImageToWorkspace={handleAddImageFromLibrary}
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
      />
    </div>
  );
}
