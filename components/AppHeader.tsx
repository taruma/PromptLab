import React from "react";
import Image from "next/image";
import {
  FolderOpen,
  SlidersHorizontal,
  FileCode2,
  FolderKanban,
  RotateCcw,
  Eye,
  ChevronDown,
} from "lucide-react";
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
  onOpenOutputRenderer?: () => void;
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
  isStructuredOutput?: boolean;
  setIsStructuredOutput?: (enabled: boolean) => void;
}

export default function AppHeader({
  onOpenLibrary,
  onOpenEngineConfig,
  onOpenPromptConfig,
  onClearSession,
  onOpenProjects,
  onOpenOutputRenderer,
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
  isStructuredOutput,
  setIsStructuredOutput,
}: AppHeaderProps) {
  return (
    <header
      className="border-b border-[#D1D1CF] px-3 md:px-6 lg:px-8 flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-30 py-2 md:py-0 md:h-14 gap-2 md:gap-3"
      id="app-header"
    >
      {/* Row 1 on Mobile / Left & Runtime Zones on Desktop */}
      <div className="flex items-center justify-between md:justify-start gap-2 md:gap-3 w-full md:w-auto min-w-0">
        {/* Brand Identity */}
        <h1 className="text-base sm:text-lg font-black tracking-tighter uppercase flex items-center gap-1.5 shrink-0 text-[#1A1A1A]">
          <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center shrink-0">
            <Image
              src="/logo_promptlab.png"
              alt="PromptLab Logo"
              width={24}
              height={24}
              className="object-contain invert"
              referrerPolicy="no-referrer"
            />
          </div>
          <span>PromptLab</span>
        </h1>

        <div className="hidden md:block h-5 w-px bg-[#D1D1CF] shrink-0" aria-hidden="true" />

        {/* Context Zone: Workspace + Preset */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenProjects && (
            <button
              type="button"
              onClick={onOpenProjects}
              className="h-8 px-2.5 bg-white hover:bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] rounded-none shrink-0"
              title="Manage Project Workspaces"
              id="project-manager-btn"
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="max-w-[85px] sm:max-w-[110px] xl:max-w-[140px] truncate font-black text-[#1A1A1A]">
                {currentProjectName}
              </span>
              <ChevronDown className="w-3 h-3 text-[#888884] shrink-0" />
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
        </div>

        {/* Runtime Zone: Quick Model + API Key */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <div className="h-5 w-px bg-[#D1D1CF] mr-1.5 shrink-0" aria-hidden="true" />
          {selectedModel && setSelectedModel && thinkingLevel && setThinkingLevel && (
            <QuickModelSelector
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              thinkingLevel={thinkingLevel}
              setThinkingLevel={setThinkingLevel}
              isStructuredOutput={isStructuredOutput}
              setIsStructuredOutput={setIsStructuredOutput}
              onOpenEngineConfig={onOpenEngineConfig}
            />
          )}
          <QuickApiKeySelector
            customApiKey={customApiKey}
            setCustomApiKey={setCustomApiKey}
            onOpenEngineConfig={onOpenEngineConfig}
          />
        </div>
      </div>

      {/* Row 2 on Mobile / Right Utility Zone on Desktop */}
      <div className="flex items-center justify-between md:justify-end gap-1.5 w-full md:w-auto pt-1.5 md:pt-0 border-t md:border-t-0 border-[#D1D1CF]/60 shrink-0">
        {onOpenOutputRenderer && (
          <button
            type="button"
            onClick={onOpenOutputRenderer}
            className="flex-1 md:flex-none md:w-8 h-8 justify-center bg-white hover:bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] transition-colors cursor-pointer flex items-center rounded-none shrink-0"
            title="Open Output Renderer (Split-Screen Previewer)"
            aria-label="Open Output Renderer"
            id="output-renderer-header-btn"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenLibrary}
          className="flex-1 md:flex-none md:w-8 h-8 justify-center bg-white hover:bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] transition-colors cursor-pointer flex items-center rounded-none shrink-0"
          title="Open Asset Library & Casting Bank"
          aria-label="Open Asset Library"
          id="open-library-header-btn"
        >
          <FolderOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        </button>

        <button
          type="button"
          onClick={onOpenEngineConfig}
          className="flex-1 md:flex-none justify-center h-8 px-2 lg:px-2.5 bg-white hover:bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 rounded-none font-mono"
          title="Configure Engine Model & Parameters"
          id="engine-controls-btn"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="hidden lg:inline">Engine</span>
        </button>

        <button
          type="button"
          onClick={onOpenPromptConfig}
          className="flex-1 md:flex-none justify-center h-8 px-2 lg:px-2.5 bg-white hover:bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 rounded-none font-mono"
          title="Configure System Prompt & Template"
          id="configure-prompts-btn"
        >
          <FileCode2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="hidden lg:inline">Prompts</span>
        </button>

        <div className="hidden md:block h-5 w-px bg-[#D1D1CF] mx-0.5 shrink-0" aria-hidden="true" />

        <button
          type="button"
          onClick={onClearSession}
          className="flex-1 md:flex-none md:w-8 h-8 justify-center bg-white hover:bg-rose-50 border border-[#D1D1CF] hover:border-rose-400 text-[#1A1A1A] hover:text-rose-900 transition-colors cursor-pointer flex items-center rounded-none shrink-0"
          title="Clear all active inputs, uploaded files, and generation results"
          aria-label="Clear active session"
          id="clear-session-btn"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        </button>

        <KofiButton variant="header" className="flex-1 md:flex-none md:w-8 h-8 shrink-0" />
      </div>
    </header>
  );
}

