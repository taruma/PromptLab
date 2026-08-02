import React from "react";
import Image from "next/image";
import { FolderOpen, Sparkles, Settings, FolderKanban, RotateCcw } from "lucide-react";
import QuickPresetSelector, { PresetItem } from "./QuickPresetSelector";
import QuickApiKeySelector from "./QuickApiKeySelector";
import QuickModelSelector from "./QuickModelSelector";
import { UserPreset } from "../lib/preset-export";
import KofiButton from "./KofiButton";

interface AppHeaderProps {
  onOpenLibrary: () => void;
  onOpenEngineConfig: () => void;
  onOpenPromptConfig: () => void;
  onClearSession: () => void;
  onOpenProjects?: () => void;
  onOpenKofiSupport?: () => void;
  currentProjectName?: string;
  presets?: PresetItem[];
  customPresets?: UserPreset[];
  systemPrompt?: string;
  promptTemplate?: string;
  loadedPresetId?: string | null;
  pinnedPresetIds?: string[];
  onSelectPreset?: (preset: PresetItem) => void;
  onTogglePinPreset?: (id: string, e?: React.MouseEvent) => void;
  customApiKey?: string;
  setCustomApiKey?: (key: string) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  thinkingLevel?: string;
  setThinkingLevel?: (level: string) => void;
}

export default function AppHeader({
  onOpenLibrary,
  onOpenEngineConfig,
  onOpenPromptConfig,
  onClearSession,
  onOpenProjects,
  currentProjectName = "Main Workspace",
  presets = [],
  customPresets = [],
  systemPrompt = "",
  promptTemplate = "",
  loadedPresetId = null,
  pinnedPresetIds = [],
  onSelectPreset,
  onTogglePinPreset,
  customApiKey = "",
  setCustomApiKey,
  selectedModel,
  setSelectedModel,
  thinkingLevel,
  setThinkingLevel,
}: AppHeaderProps) {
  return (
    <header className="border-b border-[#D1D1CF] px-3 md:px-10 flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-30 py-2.5 md:py-0 md:h-20 gap-2 md:gap-4" id="app-header">
      {/* Row 1 on Mobile / Left Section on Desktop */}
      <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 md:gap-4 w-full md:w-auto shrink-0">
        <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter uppercase flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
            <Image 
              src="/logo_promptlab.png" 
              alt="PromptLab Logo" 
              width={28} 
              height={28} 
              className="object-contain invert"
              referrerPolicy="no-referrer"
            />
          </div>
          <span>PromptLab</span>
        </h1>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {onOpenProjects && (
            <button
              type="button"
              onClick={onOpenProjects}
              className="h-8.5 px-2 sm:px-3 bg-amber-50/90 hover:bg-amber-100/90 border border-amber-300 hover:border-amber-600 transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-2xs rounded-none shrink-0"
              title="Manage Project Workspaces"
              id="project-manager-btn"
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="max-w-[80px] sm:max-w-[120px] md:max-w-[160px] truncate font-black text-amber-950">
                {currentProjectName}
              </span>
              <FolderOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:inline ml-0.5" />
            </button>
          )}

          {onSelectPreset && (
            <div className="hidden sm:block">
              <QuickPresetSelector
                presets={presets}
                customPresets={customPresets}
                systemPrompt={systemPrompt}
                promptTemplate={promptTemplate}
                loadedPresetId={loadedPresetId}
                pinnedPresetIds={pinnedPresetIds}
                onSelectPreset={onSelectPreset}
                onOpenPromptConfig={onOpenPromptConfig}
                onTogglePinPreset={onTogglePinPreset}
              />
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5">
            <QuickApiKeySelector
              customApiKey={customApiKey}
              setCustomApiKey={setCustomApiKey}
              onOpenEngineConfig={onOpenEngineConfig}
            />
            {selectedModel && setSelectedModel && thinkingLevel && setThinkingLevel && (
              <QuickModelSelector
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                thinkingLevel={thinkingLevel}
                setThinkingLevel={setThinkingLevel}
                onOpenEngineConfig={onOpenEngineConfig}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Row 2 on Mobile / Right Section on Desktop */}
      <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 w-full md:w-auto pt-1.5 md:pt-0 border-t md:border-t-0 border-[#D1D1CF]/60 shrink-0">
        <KofiButton variant="header" label="Support" className="flex-1 md:flex-none justify-center h-8.5" />

        <button
          onClick={onOpenLibrary}
          className="flex-1 md:flex-none justify-center h-8.5 px-2 md:px-2.5 bg-teal-50/80 hover:bg-teal-100/90 border border-teal-300/80 hover:border-teal-400 text-teal-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Open Asset Library & Casting Bank"
          id="open-library-header-btn"
        >
          <FolderOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden md:inline">Assets</span>
        </button>
        <button
          onClick={onOpenEngineConfig}
          className="flex-1 md:flex-none justify-center h-8.5 px-2 md:px-2.5 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-300/80 hover:border-indigo-400 text-indigo-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Configure Engine Model & Parameters"
          id="engine-controls-btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="hidden md:inline">Engine</span>
        </button>
        <button
          onClick={onOpenPromptConfig}
          className="flex-1 md:flex-none justify-center h-8.5 px-2 md:px-2.5 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-300/80 hover:border-amber-400 text-amber-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Configure System Prompt & Template"
          id="configure-prompts-btn"
        >
          <Settings className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="hidden md:inline">Prompts</span>
        </button>
        <button
          onClick={onClearSession}
          className="flex-1 md:flex-none justify-center h-8.5 px-2 md:px-2.5 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200 hover:border-rose-300 text-rose-900 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Clear all active inputs, uploaded files, and generation results"
          id="clear-session-btn"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="hidden md:inline">Clear</span>
        </button>
      </div>
    </header>
  );
}

