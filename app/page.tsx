"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Download
} from "lucide-react";

interface UploadedImage {
  id: string;
  label: string;
  base64: string;
  mimeType: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  variables: Record<string, string>;
  images: { label: string; base64: string; mimeType: string }[];
  output: string;
  filledPrompt: string;
}

export default function PromptGeneratorPage() {
  // Config loaded from backend or local storage
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [promptTemplate, setPromptTemplate] = useState<string>("");
  const [variables, setVariables] = useState<string[]>([]);

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
  const [copied, setCopied] = useState<boolean>(false);
  const [showCompiled, setShowCompiled] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);

  // Prompt Config Modal state
  const [isPromptConfigOpen, setIsPromptConfigOpen] = useState<boolean>(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState<string>("");
  const [tempPromptTemplate, setTempPromptTemplate] = useState<string>("");
  const [presets, setPresets] = useState<Array<{ id: string; name: string; systemPrompt: string; promptTemplate: string }>>([]);
  
  // Engine Controls states
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [thinkingLevel, setThinkingLevel] = useState<string>("MEDIUM");
  const [temperature, setTemperature] = useState<number>(1.0);
  const [maxTokens, setMaxTokens] = useState<string>("");
  
  // Engine Controls Modal states
  const [isEngineConfigOpen, setIsEngineConfigOpen] = useState<boolean>(false);
  const [tempModel, setTempModel] = useState<string>("gemini-3.5-flash");
  const [tempThinkingLevel, setTempThinkingLevel] = useState<string>("MEDIUM");
  const [tempTemperature, setTempTemperature] = useState<number>(1.0);
  const [tempMaxTokens, setTempMaxTokens] = useState<string>("");
  
  // Custom User API Key Overrides
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [tempCustomApiKey, setTempCustomApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  
  // Operational Telemetry states
  const [lastLatency, setLastLatency] = useState<number>(0);
  
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

          const savedSystemPrompt = localStorage.getItem("prompt_generator_system_prompt");
          const savedPromptTemplate = localStorage.getItem("prompt_generator_prompt_template");

          if (savedSystemPrompt !== null && savedPromptTemplate !== null) {
            setSystemPrompt(savedSystemPrompt);
            setPromptTemplate(savedPromptTemplate);
            const vars = extractVariables(savedPromptTemplate);
            setVariables(vars);

            const initialInputs: Record<string, string> = {};
            vars.forEach((v: string) => {
              if (v !== "visual_references" && v !== "cast") {
                initialInputs[v] = "";
              }
            });
            setInputs(initialInputs);
          } else {
            setSystemPrompt(data.systemPrompt || "");
            setPromptTemplate(data.promptTemplate || "");
            setVariables(data.variables || []);
            
            // Pre-populate input values with empty strings
            const initialInputs: Record<string, string> = {};
            data.variables.forEach((v: string) => {
              if (v !== "visual_references" && v !== "cast") {
                initialInputs[v] = "";
              }
            });
            setInputs(initialInputs);
          }
        } else {
          setError("Failed to load prompt files: " + data.error);
        }
      } catch (err: any) {
        setError("Error connecting to server configuration: " + err.message);
      }
    }
    loadConfig();

    // Load local storage engine configs on mount
    try {
      const savedModel = localStorage.getItem("prompt_generator_selected_model");
      const savedThinking = localStorage.getItem("prompt_generator_thinking_level");
      const savedTemp = localStorage.getItem("prompt_generator_temperature");
      const savedMaxTokens = localStorage.getItem("prompt_generator_max_tokens");
      const savedApiKey = localStorage.getItem("prompt_generator_custom_api_key");

      setTimeout(() => {
        if (savedModel) {
          setSelectedModel(savedModel);
          setTempModel(savedModel);
        }
        if (savedThinking) {
          setThinkingLevel(savedThinking);
          setTempThinkingLevel(savedThinking);
        }
        if (savedTemp) {
          const numTemp = Number(savedTemp);
          setTemperature(numTemp);
          setTempTemperature(numTemp);
        }
        if (savedMaxTokens) {
          setMaxTokens(savedMaxTokens);
          setTempMaxTokens(savedMaxTokens);
        }
        if (savedApiKey) {
          setCustomApiKey(savedApiKey);
          setTempCustomApiKey(savedApiKey);
        }
      }, 0);
    } catch (e) {
      console.error("Failed to parse engine configurations on mount", e);
    }

    // Load local storage history safely on mount (client-side only)
    try {
      const savedHistory = localStorage.getItem("prompt_generator_history");
      if (savedHistory) {
        setTimeout(() => {
          setHistory(JSON.parse(savedHistory));
        }, 0);
      }
    } catch (e) {
      console.error("Failed to parse generation history", e);
    }
  }, []);

  // Handle escape key to close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPromptConfigOpen(false);
        setIsEngineConfigOpen(false);
        setIsClearConfirmOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Helper: converts file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  // Process selected image files
  const handleImageFiles = async (files: FileList) => {
    const validImages = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validImages.length === 0) return;

    const newUploaded: UploadedImage[] = [];
    
    for (let i = 0; i < validImages.length; i++) {
      const file = validImages[i];
      try {
        const base64 = await fileToBase64(file);
        // Suggest a nice default label based on filename or numbering
        const rawName = file.name.split(".")[0];
        const cleanLabel = rawName
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase());

        newUploaded.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          label: cleanLabel,
          base64: base64,
          mimeType: file.type,
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

  // Delete uploaded image
  const handleDeleteImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  // Load a historic generation back into the editor
  const handleLoadHistoryItem = (item: HistoryItem) => {
    // Merge inputs
    const updatedInputs = { ...inputs };
    Object.keys(item.variables).forEach(k => {
      updatedInputs[k] = item.variables[k];
    });
    setInputs(updatedInputs);

    // Load images with new local IDs
    const loadedImages: UploadedImage[] = item.images.map((img, i) => ({
      id: `history-${Date.now()}-${i}`,
      label: img.label,
      base64: img.base64,
      mimeType: img.mimeType,
    }));
    
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
    setUploadedImages([]);
    setGenerationResult("");
    setFilledPrompt("");
    setThinkingResult("");
    setIsThinking(false);
    setError(null);
  };

  // Open the engine controls modal
  const handleOpenEngineConfig = () => {
    setTempModel(selectedModel);
    setTempThinkingLevel(thinkingLevel);
    setTempTemperature(temperature);
    setTempMaxTokens(maxTokens);
    setTempCustomApiKey(customApiKey);
    setShowApiKey(false);
    setIsEngineConfigOpen(true);
  };

  // Save the custom engine configuration to state and local storage
  const handleApplyEngineConfig = () => {
    setSelectedModel(tempModel);
    setThinkingLevel(tempThinkingLevel);
    setTemperature(tempTemperature);
    setMaxTokens(tempMaxTokens);
    setCustomApiKey(tempCustomApiKey);

    localStorage.setItem("prompt_generator_selected_model", tempModel);
    localStorage.setItem("prompt_generator_thinking_level", tempThinkingLevel);
    localStorage.setItem("prompt_generator_temperature", String(tempTemperature));
    localStorage.setItem("prompt_generator_max_tokens", tempMaxTokens);
    localStorage.setItem("prompt_generator_custom_api_key", tempCustomApiKey);

    setIsEngineConfigOpen(false);
  };

  // Reset the engine configurations to system defaults (Gemini 3.5 Flash, MEDIUM thinking, 1.0 temperature, and empty max tokens)
  const handleResetEngineDefaults = () => {
    setTempModel("gemini-3.5-flash");
    setTempThinkingLevel("MEDIUM");
    setTempTemperature(1.0);
    setTempMaxTokens("");
    setTempCustomApiKey("");
  };

  // Open the configuration modal
  const handleOpenPromptConfig = () => {
    setTempSystemPrompt(systemPrompt);
    setTempPromptTemplate(promptTemplate);
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

  // Save the custom configuration to local state and local storage
  const handleApplyPromptConfig = () => {
    setSystemPrompt(tempSystemPrompt);
    setPromptTemplate(tempPromptTemplate);
    const vars = extractVariables(tempPromptTemplate);
    setVariables(vars);

    // Merge previous inputs to preserve already typed entries
    setInputs(prev => {
      const updated = { ...prev };
      vars.forEach(v => {
        if (v !== "visual_references" && v !== "cast" && updated[v] === undefined) {
          updated[v] = "";
        }
      });
      return updated;
    });

    localStorage.setItem("prompt_generator_system_prompt", tempSystemPrompt);
    localStorage.setItem("prompt_generator_prompt_template", tempPromptTemplate);
    setIsPromptConfigOpen(false);
  };

  // Delete a specific history card
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
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
        const newHistoryItem: HistoryItem = {
          id: `gen-${Date.now()}`,
          timestamp: new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          variables: { ...inputs },
          images: uploadedImages.map(img => ({
            label: img.label,
            base64: img.base64,
            mimeType: img.mimeType,
          })),
          output: accumulatedText,
          filledPrompt: activeFilledPrompt || filledPrompt,
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

  return (
    <div className="min-h-screen bg-[#F4F4F2] flex flex-col font-sans text-[#1A1A1A]" id="main-content">
      {/* Header */}
      <header className="h-20 border-b border-[#D1D1CF] px-4 md:px-10 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-30" id="app-header">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
            Prompt_Lab v1.0
          </h1>
          <span className="hidden sm:inline text-[9px] uppercase tracking-widest text-[#888884] font-bold font-mono">
            {"// Secure Encapsulated Workspace"}
          </span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={handleOpenEngineConfig}
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
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[9px] text-[#888884] font-mono uppercase tracking-wider">Session Local Time</span>
            <span className="text-[10px] text-[#1A1A1A] font-mono font-bold">15:02 PST</span>
          </div>
        </div>
      </header>

      {/* Main Container Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 border-b border-[#D1D1CF]" id="workspace-layout">
        
        {/* Left Pane: Composer / Inputs (7 cols of grid) */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col gap-8 bg-[#F4F4F2] lg:border-r lg:border-[#D1D1CF]" id="input-controls-column">
          
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
              className="w-full bg-white border border-[#D1D1CF] p-4 text-sm leading-relaxed outline-none focus:border-[#1A1A1A] transition-all resize-y min-h-[120px] rounded-none font-sans text-[#1A1A1A] placeholder-stone-400"
            />
          </section>

          {/* Section: Visual Reference Assets */}
          <section className="flex flex-col gap-3" id="images-reference-section">
            <div className="flex justify-between items-end">
              <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
                Visual Assets & Casting Maps
              </h2>
              <span className="text-[9px] font-mono text-[#888884]">
                {"{{ visual_references }}"}
              </span>
            </div>

            <p className="text-[11px] text-[#888884] font-medium tracking-tight -mt-1 leading-normal">
              Upload images to serve as reference models. The system will name-map each asset (e.g. @image1) and inject references cleanly into your templates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1">
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
                <div 
                  key={img.id}
                  className="bg-white border border-[#D1D1CF] p-2.5 flex flex-col gap-2 group relative transition-all hover:border-[#1A1A1A]"
                >
                  <div className="aspect-square bg-[#EAEAE8] relative overflow-hidden flex items-center justify-center">
                    <img 
                      src={img.base64} 
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-[#1A1A1A] text-white text-[8px] font-mono font-bold px-1 py-0.2">
                      @image{index + 1}
                    </div>
                    {/* Floating delete asset */}
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1 right-1 bg-white border border-[#D1D1CF] hover:border-red-600 hover:text-red-600 text-stone-500 p-1 transition-all cursor-pointer"
                      title="Delete asset link"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-mono text-[#888884] uppercase tracking-wider">Map To Name:</span>
                    <label htmlFor={`img-label-${img.id}`} className="sr-only">Map To Name</label>
                    <input
                      id={`img-label-${img.id}`}
                      type="text"
                      value={img.label}
                      onChange={(e) => handleUpdateLabel(img.id, e.target.value)}
                      placeholder={`Cast member ${index + 1}`}
                      className="text-[11px] font-bold underline bg-transparent outline-none w-full text-[#1A1A1A] focus:text-stone-900 focus:no-underline border-b border-transparent focus:border-[#1A1A1A]"
                    />
                  </div>
                </div>
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
        <div className="lg:col-span-5 p-6 md:p-10 flex flex-col gap-10 bg-[#EAEAE8]" id="output-history-column">
          
          {/* Section: Generation Result */}
          <section className="flex-1 flex flex-col min-h-[420px]" id="output-panel">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
                Generation Result
              </h2>
              
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
                  <div className="flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-[#1A1A1A] font-serif whitespace-pre-wrap max-h-[360px] custom-scrollbar">
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

          {/* Section: Local History */}
          <section className="h-52 flex flex-col" id="history-panel">
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
                Local Session History
              </h2>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("prompt_generator_history");
                  }}
                  className="text-[9px] font-bold text-red-500 hover:text-red-700 tracking-wider font-mono uppercase cursor-pointer"
                  id="clear-all-history"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 bg-white border border-[#D1D1CF] overflow-y-auto custom-scrollbar" id="history-container">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#888884]">
                  <FolderOpen className="w-5 h-5 text-[#D1D1CF] mb-1.5" />
                  <span className="text-[9px] uppercase tracking-wider font-bold">Asset Log Empty</span>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#D1D1CF]" id="history-items-list">
                  {history.map((item) => {
                    const title = item.variables["idea"] || "Untitled Outline";
                    const snippet = title.length > 50 ? title.slice(0, 50) + "..." : title;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleLoadHistoryItem(item)}
                        className="p-3.5 hover:bg-[#F4F4F2] cursor-pointer transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] text-[#888884] font-mono">{item.timestamp}</span>
                            {item.images && item.images.length > 0 && (
                              <span className="text-[8px] bg-[#1A1A1A] text-white px-1 font-mono uppercase font-bold">
                                {item.images.length} IMG
                              </span>
                            )}
                          </div>
                          <h4 className="text-[11px] font-bold uppercase text-[#1A1A1A] truncate tracking-tight pr-2">
                            {snippet}
                          </h4>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="text-[#888884] hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 transition-all cursor-pointer"
                          title="Delete history slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

        </div>

      </div>

      {/* Footer Status Bar */}
      <footer className="h-10 px-4 md:px-10 bg-[#1A1A1A] text-white flex items-center justify-between text-[9px] font-mono shrink-0">
        <div className="flex flex-wrap gap-x-6 gap-y-1 uppercase">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Local DB: Active
          </span>
          <span>Engine: {selectedModel.replace(/-/g, "_").toUpperCase()}</span>
          <span>Reasoning: {thinkingLevel}</span>
          <span>Temp: {temperature.toFixed(1)}</span>
          <span className="text-[#66BB66] hidden sm:inline">Files: system_prompt.txt, prompt_template.txt Loaded</span>
        </div>
        <div className="uppercase opacity-50 tracking-wider">© 2026 Lab_Internal</div>
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
                onClick={() => setIsPromptConfigOpen(false)}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#F4F4F2]/50">
              
              {/* Left Sidebar: Presets & Disk Management */}
              <div className="w-full md:w-64 border-r border-[#D1D1CF] bg-white p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="flex flex-col gap-5">
                  
                  {/* Preset list header */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] mb-3">
                      Select Quick Preset
                    </h4>
                    
                    <div className="flex flex-col gap-1.5">
                      {presets.map((preset) => {
                        const isActive = tempSystemPrompt === preset.systemPrompt && tempPromptTemplate === preset.promptTemplate;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setTempSystemPrompt(preset.systemPrompt);
                              setTempPromptTemplate(preset.promptTemplate);
                            }}
                            className={`w-full text-left px-3 py-2 border text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex flex-col gap-0.5 ${
                              isActive 
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                                : "bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white"
                            }`}
                          >
                            <span className="truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                      {presets.length === 0 && (
                        <div className="text-[9px] text-[#888884] font-mono italic p-2 border border-[#D1D1CF] bg-[#F4F4F2] uppercase text-center">
                          No Presets Found
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-[#D1D1CF]" />

                  {/* Import / Export header */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] mb-3">
                      Import / Export Config
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                      {/* Hidden Input */}
                      <input 
                        type="file" 
                        ref={jsonInputRef} 
                        onChange={handleImportJSON} 
                        accept=".json" 
                        className="hidden" 
                      />
                      
                      <button
                        onClick={() => jsonInputRef.current?.click()}
                        className="w-full py-2 bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                        Open JSON Config
                      </button>

                      <button
                        onClick={handleExportJSON}
                        className="w-full py-2 bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        Save JSON Config
                      </button>
                    </div>
                  </div>

                </div>

                {/* Bottom of sidebar: Restore to files */}
                <div className="pt-5 border-t border-[#D1D1CF] mt-5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] mb-2.5">
                    Original Template files
                  </h4>
                  <button
                    onClick={handleRestoreDefaultPrompts}
                    className="w-full py-2 bg-red-50/50 hover:bg-red-50 text-red-700 border border-red-200 hover:border-red-400 text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="Load original prompts from .txt templates"
                  >
                    <RefreshCw className="w-3 h-3 shrink-0" />
                    Reset to TXT Files
                  </button>
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
                      Use double curly-braces <code className="font-mono bg-[#F4F4F2] px-1 text-[#1A1A1A] font-bold text-[9px]">{"{{ name }}"}</code> in your template. Prompt_Lab generates input composers for them instantly on save.
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
                  onClick={() => setIsPromptConfigOpen(false)}
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
      {isEngineConfigOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6" id="engine-config-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-3xl h-auto max-h-[90vh] flex flex-col justify-between shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-16 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#888884]" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans">
                  Engine Settings & Parameters
                </h3>
              </div>
              <button
                onClick={() => setIsEngineConfigOpen(false)}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F4F4F2]/30">
              
              {/* Alert Warning for Paid Models */}
              {tempModel === "gemini-3.1-pro-preview" && !tempCustomApiKey && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 text-[10px] leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex flex-col gap-1 text-amber-800">
                    <span className="font-bold uppercase tracking-wider text-[9px] font-mono">Premium Engine Selected:</span>
                    <p>
                      The <code className="font-mono bg-amber-100 px-1 font-bold">gemini-3.1-pro-preview</code> model requires a paid API key. Make sure your key is configured in the <strong>Settings &gt; Secrets</strong> panel or provided below in the custom key field.
                    </p>
                  </div>
                </div>
              )}

              {/* Custom API Key Override Field */}
              <div className="bg-white border border-[#D1D1CF] p-4 flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1.5">
                    <span>Custom Gemini API Key Override</span>
                    {tempCustomApiKey ? (
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider">
                        Override Active
                      </span>
                    ) : (
                      <span className="text-[8px] bg-stone-100 text-stone-500 border border-stone-300 font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider">
                        Default Env Key
                      </span>
                    )}
                  </h4>
                  <span className="text-[9px] font-mono text-[#888884] font-bold uppercase">
                    Stored locally in browser
                  </span>
                </div>
                <p className="text-[10px] text-[#888884] leading-normal">
                  Provide your own developer Gemini API Key. This will override the default server key if supplied. Perfect for utilizing personal quotas or running premium models.
                </p>
                <div className="relative flex items-stretch mt-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={tempCustomApiKey}
                    onChange={(e) => setTempCustomApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-white border border-[#D1D1CF] p-3 pr-10 text-xs font-mono outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1A1A1A] transition-colors cursor-pointer"
                    title={showApiKey ? "Hide Key" : "Show Key"}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Grid: Left column (Model Selector) & Right column (Params Selector) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Model Selection */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                    Select Generation Model
                  </h4>
                  <div className="flex flex-col gap-3">
                    {/* Model Option 1 */}
                    <button
                      onClick={() => {
                        setTempModel("gemini-3.5-flash");
                      }}
                      className={`w-full text-left p-4 border text-xs transition-all cursor-pointer flex flex-col gap-1.5 rounded-none ${
                        tempModel === "gemini-3.5-flash"
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                          : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                      }`}
                    >
                      <div className="flex justify-between items-baseline w-full">
                        <span className="font-black uppercase tracking-wider font-mono">Gemini 3.5 Flash</span>
                        <span className="text-[8px] font-mono opacity-65 font-bold uppercase">Standard / Free</span>
                      </div>
                      <p className={`text-[10px] leading-normal ${tempModel === "gemini-3.5-flash" ? "text-stone-300" : "text-[#888884]"}`}>
                        Best general-purpose model. Fast performance and balanced creativity for standard scriptwriting and copy structuring.
                      </p>
                    </button>

                    {/* Model Option 2 */}
                    <button
                      onClick={() => {
                        setTempModel("gemini-3.1-flash-lite");
                      }}
                      className={`w-full text-left p-4 border text-xs transition-all cursor-pointer flex flex-col gap-1.5 rounded-none ${
                        tempModel === "gemini-3.1-flash-lite"
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                          : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                      }`}
                    >
                      <div className="flex justify-between items-baseline w-full">
                        <span className="font-black uppercase tracking-wider font-mono">Gemini 3.1 Flash Lite</span>
                        <span className="text-[8px] font-mono opacity-65 font-bold uppercase">Fast / Free</span>
                      </div>
                      <p className={`text-[10px] leading-normal ${tempModel === "gemini-3.1-flash-lite" ? "text-stone-300" : "text-[#888884]"}`}>
                        Low latency engine. Perfect for rapid prototyping, instant synthesis iterations, and low-complexity tasks.
                      </p>
                    </button>

                    {/* Model Option 3 */}
                    <button
                      onClick={() => {
                        setTempModel("gemini-3.1-pro-preview");
                        // Pro model does not support MINIMAL thinking level
                        if (tempThinkingLevel === "MINIMAL") {
                          setTempThinkingLevel("HIGH");
                        }
                      }}
                      className={`w-full text-left p-4 border text-xs transition-all cursor-pointer flex flex-col gap-1.5 rounded-none ${
                        tempModel === "gemini-3.1-pro-preview"
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                          : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                      }`}
                    >
                      <div className="flex justify-between items-baseline w-full">
                        <span className="font-black uppercase tracking-wider font-mono">Gemini 3.1 Pro</span>
                        <span className="text-[8px] font-mono opacity-65 font-bold uppercase text-amber-500">Advanced / Paid</span>
                      </div>
                      <p className={`text-[10px] leading-normal ${tempModel === "gemini-3.1-pro-preview" ? "text-stone-300" : "text-[#888884]"}`}>
                        Complex text tasks and deep reasoning. Exceptional at intricate code specifications, deep creative plots, and detailed scripts.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Column 2: Parameters */}
                <div className="flex flex-col gap-5">
                  
                  {/* Reasoning Level Selector */}
                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                      Reasoning Effort (Thinking Level)
                    </h4>
                    <p className="text-[10px] text-[#888884] leading-normal">
                      Controls the model&apos;s internal reasoning depth before outputting results. High reasoning enhances logic but may add latency.
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 mt-1">
                      {["HIGH", "MEDIUM", "LOW", "MINIMAL"].map((lvl) => {
                        const isSelected = tempThinkingLevel === lvl;
                        const isDisabled = lvl === "MINIMAL" && tempModel === "gemini-3.1-pro-preview";
                        return (
                          <button
                            key={lvl}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setTempThinkingLevel(lvl)}
                            className={`py-2 text-[9px] font-bold tracking-wider uppercase border text-center transition-all ${
                              isDisabled
                                ? "bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed"
                                : isSelected
                                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                  : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A] cursor-pointer"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="border-[#D1D1CF]" />

                  {/* Temperature Slider */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                        Temperature (Creativity)
                      </h4>
                      <span className="text-xs font-mono font-bold bg-[#EAEAE8] border border-[#D1D1CF] px-2 py-0.5">
                        {tempTemperature.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888884] leading-normal">
                      Higher values mean more random, highly creative results. Lower values restrict the output to be deterministic and literal.
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-mono uppercase text-[#888884]">Stark</span>
                      <input
                        type="range"
                        min="0.0"
                        max="2.0"
                        step="0.1"
                        value={tempTemperature}
                        onChange={(e) => setTempTemperature(Number(e.target.value))}
                        className="flex-1 accent-[#1A1A1A] cursor-pointer h-1.5 bg-[#D1D1CF] rounded-none outline-none"
                      />
                      <span className="text-[9px] font-mono uppercase text-[#888884]">Wild</span>
                    </div>
                  </div>

                  <hr className="border-[#D1D1CF]" />

                  {/* Max Tokens input */}
                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                      Max Output Tokens Limit
                    </h4>
                    <p className="text-[10px] text-[#888884] leading-normal">
                      Specifies the absolute threshold for total tokens. Set blank to utilize natural auto-truncation guidelines.
                    </p>
                    <label htmlFor="temp-max-tokens" className="sr-only">Max Output Tokens</label>
                    <input
                      id="temp-max-tokens"
                      type="text"
                      pattern="[0-9]*"
                      value={tempMaxTokens}
                      onChange={(e) => setTempMaxTokens(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 2048 (leave blank for default auto)"
                      className="bg-white border border-[#D1D1CF] p-3 text-xs font-mono outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A] mt-1"
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
              <button
                type="button"
                onClick={handleResetEngineDefaults}
                className="px-3 py-2 border border-[#D1D1CF] hover:border-red-500 hover:text-red-500 hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 bg-white"
                title="Reset settings to standard system defaults"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEngineConfigOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyEngineConfig}
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
                >
                  Apply Engine Overrides
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

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
    </div>
  );
}
