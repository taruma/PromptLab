import React from "react";
import { HelpCircle, ChevronDown, ChevronRight, BookOpen, Layers, Sparkles, FolderOpen, FileText } from "lucide-react";

interface LabManualSectionProps {
  isLabManualOpen: boolean;
  toggleLabManual: () => void;
}

export default function LabManualSection({
  isLabManualOpen,
  toggleLabManual,
}: LabManualSectionProps) {
  return (
    <section className="flex flex-col shrink-0" id="lab-manual-panel">
      <div 
        onClick={toggleLabManual}
        className="flex justify-between items-center mb-1 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Lab Manual &amp; Quick-Start Guide
          </h2>
          <span className="text-[#888884] group-hover:text-[#1A1A1A] transition-colors">
            {isLabManualOpen ? (
              <ChevronDown className="w-3.5 h-3.5 transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 transition-transform" />
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
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Configure &amp; Presets</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Select system presets from the top dropdown or click <strong className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded-none border border-amber-200">Prompts</strong> to edit System Instructions, variables (<code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">{"{{ variable }}"}</code>), compare diffs, or export/share URL presets.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">2</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Input Active Specs</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Enter your core creative direction under <strong className="text-[#1A1A1A]">Main Objective / Idea</strong>. Dynamic parameter forms auto-populate below for all custom placeholders in your template.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">3</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Reference Media &amp; Assets</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Attach images (<code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">@imageX</code>), videos (<code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">@videoX</code>), audio (<code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">@audioX</code>), or documents (<code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">@docX</code>) via <strong className="text-[#1A1A1A]">Files API</strong> or saved <strong className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded-none border border-teal-200">Assets</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">4</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Synthesize &amp; Inspect</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Set Gemini models, reasoning effort, or custom API keys in <strong className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded-none border border-indigo-200">Engine</strong>. Hit <strong className="text-[#1A1A1A]">Generate Sequence</strong> (or press <kbd className="font-mono bg-[#EAEAE8] border border-[#D1D1CF] px-1 py-0.5 text-[9px] text-[#1A1A1A] font-normal">Ctrl+Enter</kbd>) to stream real-time thinking traces, cost estimates, and toggle Formatted/Raw views.
                </p>
              </div>
            </div>
          </div>

          {/* Key Tips Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#D1D1CF]/60 text-[10px]">
            <div className="flex items-center gap-1.5 p-2 bg-[#F4F4F2]/60 border border-[#D1D1CF]/80 text-[#1A1A1A]">
              <Layers className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span><strong>Projects:</strong> Organize workspaces in the top-left dropdown.</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-[#F4F4F2]/60 border border-[#D1D1CF]/80 text-[#1A1A1A]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span><strong>Reasoning:</strong> Adjust thinking effort (Minimal → High).</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-[#F4F4F2]/60 border border-[#D1D1CF]/80 text-[#1A1A1A]">
              <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span><strong>History:</strong> Recall past sessions &amp; export JSON archives.</span>
            </div>
          </div>

          {/* Footer link to Repository */}
          <div className="border-t border-[#D1D1CF] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F4F4F2]/50 p-2.5 border-dashed">
            <span className="text-[10px] text-[#888884] font-medium leading-relaxed">
              Need full project source code, developer guidelines, or documentation?
            </span>
            <a 
              href="https://github.com/taruma/PromptLab" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-none self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Open Repo
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

