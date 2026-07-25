import React from "react";
import Image from "next/image";
import { FolderOpen, Sparkles, Settings, FolderKanban, ExternalLink } from "lucide-react";
import QuickPresetSelector, { PresetItem } from "./QuickPresetSelector";
import { UserPreset } from "../lib/preset-export";

interface AppHeaderProps {
  onOpenLibrary: () => void;
  onOpenEngineConfig: () => void;
  onOpenPromptConfig: () => void;
  onClearSession: () => void;
  onOpenProjects?: () => void;
  currentProjectName?: string;
  presets?: PresetItem[];
  customPresets?: UserPreset[];
  systemPrompt?: string;
  promptTemplate?: string;
  loadedPresetId?: string | null;
  pinnedPresetIds?: string[];
  onSelectPreset?: (preset: PresetItem) => void;
  onTogglePinPreset?: (id: string, e?: React.MouseEvent) => void;
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
}: AppHeaderProps) {
  return (
    <header className="h-20 border-b border-[#D1D1CF] px-4 md:px-10 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-30" id="app-header">
      <div className="flex items-center gap-3 md:gap-4">
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

        {onOpenProjects && (
          <button
            type="button"
            onClick={onOpenProjects}
            className="h-8.5 px-3 bg-amber-50/90 hover:bg-amber-100/90 border border-amber-300 hover:border-amber-600 transition-all cursor-pointer flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-2xs rounded-none"
            title="Manage Project Workspaces"
            id="project-manager-btn"
          >
            <FolderKanban className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="max-w-[110px] sm:max-w-[150px] md:max-w-[200px] truncate font-black text-amber-950">
              {currentProjectName}
            </span>
            <FolderOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-0.5" />
          </button>
        )}

        {onSelectPreset && (
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
        )}
      </div>
      
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onOpenLibrary}
          className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-white"
          title="Open Asset Library & Casting Bank"
          id="open-library-header-btn"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
          Asset Library
        </button>
        <button
          onClick={onOpenEngineConfig}
          className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-white"
          title="Configure Engine Model & Parameters"
          id="engine-controls-btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          Engine Controls
        </button>
        <button
          onClick={onOpenPromptConfig}
          className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-white"
          title="Configure System Prompt & Template"
          id="configure-prompts-btn"
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          Configure Prompts
        </button>
        <button
          onClick={onClearSession}
          className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          title="Clear all active inputs, uploaded files, and generation results"
          id="clear-session-btn"
        >
          Clear Session
        </button>
      </div>
    </header>
  );
}

