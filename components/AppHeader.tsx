import React from "react";
import Image from "next/image";
import { FolderOpen, Sparkles, Settings, FolderKanban, RotateCcw } from "lucide-react";
import QuickPresetSelector, { PresetItem } from "./QuickPresetSelector";
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
      
      <div className="flex items-center gap-1.5 sm:gap-2">
        <KofiButton variant="header" label="Support" />

        <button
          onClick={onOpenLibrary}
          className="px-2.5 py-1.5 bg-teal-50/80 hover:bg-teal-100/90 border border-teal-300/80 hover:border-teal-400 text-teal-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Open Asset Library & Casting Bank"
          id="open-library-header-btn"
        >
          <FolderOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden sm:inline">Assets</span>
        </button>
        <button
          onClick={onOpenEngineConfig}
          className="px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-300/80 hover:border-indigo-400 text-indigo-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Configure Engine Model & Parameters"
          id="engine-controls-btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="hidden sm:inline">Engine</span>
        </button>
        <button
          onClick={onOpenPromptConfig}
          className="px-2.5 py-1.5 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-300/80 hover:border-amber-400 text-amber-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Configure System Prompt & Template"
          id="configure-prompts-btn"
        >
          <Settings className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="hidden sm:inline">Prompts</span>
        </button>
        <button
          onClick={onClearSession}
          className="px-2.5 py-1.5 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200 hover:border-rose-300 text-rose-900 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono"
          title="Clear all active inputs, uploaded files, and generation results"
          id="clear-session-btn"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </header>
  );
}

