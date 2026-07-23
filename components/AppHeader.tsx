import React from "react";
import Image from "next/image";
import { FolderOpen, Sparkles, Settings } from "lucide-react";

interface AppHeaderProps {
  onOpenLibrary: () => void;
  onOpenEngineConfig: () => void;
  onOpenPromptConfig: () => void;
  onClearSession: () => void;
}

export default function AppHeader({
  onOpenLibrary,
  onOpenEngineConfig,
  onOpenPromptConfig,
  onClearSession,
}: AppHeaderProps) {
  return (
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
