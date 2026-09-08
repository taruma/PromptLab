"use client";

import React, { useState, useMemo } from "react";
import { parseAuteurScript, AuteurStagingBlock, AuteurMacroState } from "@/lib/auteur-parser";
import { Clapperboard, ChevronDown, ChevronRight } from "lucide-react";

interface AuteurScriptViewProps {
  content: string;
  className?: string;
}

/**
 * Tokenizes and formats an Auteur line into styled React elements.
 * Calibrated font metrics: comfortable, highly legible text scale (12.5px–13px)
 * with proportional tags (11.5px) aligned seamlessly on the font baseline.
 */
function renderFormattedAuteurSegment(
  text: string,
  aestheticTokens: string[],
  characterNames: string[],
  keyPrefix = "seg"
): React.ReactNode[] {
  if (!text) return [];

  // Build combined tokenization pattern:
  // 1. Bracketed tags: [CAM], [ACT 01], [BLOCK], [VFX], [TRANS], [STATE IN]
  // 2. Multimodal refs: @image1, @actor1, @image2
  // 3. Foley sound cues: <Resonant metallic gong strike...>
  // 4. In-line dialogue: {-keep pushing!-}, {Forget what the outside world taught you...}
  // 5. Aesthetic mapping tokens: LOC01, WAR_ROB01, DIN01
  // 6. Character names: Robert, Arthur, Samira
  const parts: { pattern: string; type: string }[] = [
    { pattern: "\\[[A-Za-z0-9\\s_%-]+\\]", type: "tag" },
    { pattern: "@[A-Za-z0-9_%-]+", type: "ref" },
    { pattern: "<[^>]+>", type: "audio" },
    { pattern: "\\{[-–]?[^}]+[-–]?\\}", type: "dial" },
  ];

  if (aestheticTokens.length > 0) {
    const escapedTokens = aestheticTokens
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    parts.push({ pattern: `\\b(?:${escapedTokens})\\b`, type: "token" });
  }

  if (characterNames.length > 0) {
    const escapedNames = characterNames
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    parts.push({ pattern: `\\b(?:${escapedNames})\\b`, type: "char" });
  }

  const combinedRegex = new RegExp(
    `(${parts.map((p) => p.pattern).join("|")})`,
    "g"
  );

  const tokens = text.split(combinedRegex);
  const elements: React.ReactNode[] = [];

  const charUpperSet = new Set(characterNames.map((n) => n.toUpperCase()));
  const tokenUpperSet = new Set(aestheticTokens.map((t) => t.toUpperCase()));

  tokens.forEach((token, idx) => {
    if (!token) return;
    const key = `${keyPrefix}-${idx}`;

    if (token.startsWith("[") && token.endsWith("]")) {
      elements.push(
        <span
          key={key}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-[11.5px] font-mono font-bold bg-[#EAEAE8] text-[#1A1A1A] border border-[#D1D1CF] leading-tight uppercase tracking-wide select-text align-baseline shadow-2xs"
        >
          {token}
        </span>
      );
    } else if (token.startsWith("@")) {
      elements.push(
        <span
          key={key}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-[11.5px] font-mono font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 leading-tight select-text align-baseline shadow-2xs"
        >
          {token}
        </span>
      );
    } else if (token.startsWith("<") && token.endsWith(">")) {
      elements.push(
        <span
          key={key}
          className="font-mono text-xs md:text-[12.5px] italic text-[#4A4A48] bg-[#F4F4F2] px-1.5 py-0.5 mx-0.5 border border-[#D1D1CF] select-text inline-block align-baseline leading-tight"
        >
          {token}
        </span>
      );
    } else if (token.startsWith("{") && token.endsWith("}")) {
      elements.push(
        <span
          key={key}
          className="font-serif italic text-[#1A1A1A] bg-amber-50/90 border-b border-amber-400 px-1.5 py-0.5 mx-0.5 select-text inline-block align-baseline leading-tight text-xs md:text-[13px]"
        >
          {token}
        </span>
      );
    } else if (tokenUpperSet.has(token.toUpperCase())) {
      elements.push(
        <span
          key={key}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-[11.5px] font-mono font-bold text-amber-900 bg-amber-50 border border-amber-400 leading-tight select-text align-baseline shadow-2xs"
        >
          {token}
        </span>
      );
    } else if (charUpperSet.has(token.toUpperCase())) {
      elements.push(
        <span key={key} className="font-mono font-bold text-blue-900 select-text">
          {token}
        </span>
      );
    } else {
      elements.push(token);
    }
  });

  return elements;
}

/**
 * Formats lines inside Staging blocks with key-value alignment where applicable
 */
function renderStagingBlockContent(
  block: AuteurStagingBlock,
  aestheticTokens: string[],
  characterNames: string[]
): React.ReactNode {
  return (
    <div className="space-y-1.5 text-xs md:text-[12.5px] font-mono leading-relaxed select-text text-[#1A1A1A]">
      {block.lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Detect "Key:" label at the beginning of a line (e.g. MEDIUM:, PALETTE:, WARDROBE:, Hair/Makeup:, Location:)
        const keyMatch = trimmed.match(/^([A-Za-z0-9_\s\/-]{2,22}:)(.*)$/);
        if (keyMatch) {
          const keyLabel = keyMatch[1];
          const rest = keyMatch[2];
          return (
            <div key={`st-${block.name}-${lIdx}`} className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-0.5">
              <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-xs md:text-[12px] sm:min-w-[120px] shrink-0 font-mono">
                {keyLabel}
              </span>
              <span className="flex-1">
                {renderFormattedAuteurSegment(rest, aestheticTokens, characterNames, `st-${lIdx}`)}
              </span>
            </div>
          );
        }

        return (
          <div key={`st-${block.name}-${lIdx}`} className="py-0.5">
            {renderFormattedAuteurSegment(trimmed, aestheticTokens, characterNames, `st-${lIdx}`)}
          </div>
        );
      })}
    </div>
  );
}

export default function AuteurScriptView({ content, className = "" }: AuteurScriptViewProps) {
  const parsed = useMemo(() => parseAuteurScript(content), [content]);

  // Persistent collapsed staging blocks (default: all uncollapsed)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prompt_generator_auteur_collapsed_staging");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load auteur collapsed blocks preference:", e);
      }
    }
    return {};
  });

  // Toggle individual macro block collapse and persist
  const toggleBlockCollapse = (blockName: string) => {
    setCollapsedBlocks((prev) => {
      const next = { ...prev, [blockName]: !prev[blockName] };
      try {
        localStorage.setItem("prompt_generator_auteur_collapsed_staging", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save auteur collapsed blocks preference:", e);
      }
      return next;
    });
  };

  // Quick toggle all blocks collapse/expand
  const toggleAllCollapse = () => {
    const allCollapsed = parsed.stagingBlocks.every((sb) => collapsedBlocks[sb.name]);
    const next: Record<string, boolean> = {};
    for (const sb of parsed.stagingBlocks) {
      next[sb.name] = !allCollapsed;
    }
    setCollapsedBlocks(next);
    try {
      localStorage.setItem("prompt_generator_auteur_collapsed_staging", JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save auteur collapsed blocks preference:", e);
    }
  };

  const macroStates = parsed.macroStates || parsed.executionBeats || [];

  if (!parsed.isAuteur && parsed.stagingBlocks.length === 0 && macroStates.length === 0) {
    return (
      <div className="p-4 bg-[#FAFAF9] border border-[#D1D1CF] text-[#888884] font-mono text-xs text-center">
        No structured Auteur Script syntax detected. Switch to MD or Raw view.
      </div>
    );
  }

  const allStagingCollapsed = parsed.stagingBlocks.length > 0 && parsed.stagingBlocks.every((sb) => collapsedBlocks[sb.name]);

  return (
    <div className={`space-y-3.5 font-mono select-text ${className}`} id="auteur-script-visual-canvas">
      {/* Title Header (if provided in script) */}
      {parsed.title && (
        <div className="flex items-center justify-center gap-3 py-1 mb-1">
          <span className="h-px flex-1 max-w-[60px] bg-[#D1D1CF]" />
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-mono font-bold uppercase tracking-widest text-[#1A1A1A] bg-[#FFFFFF] border border-[#D1D1CF] px-3 py-1 shadow-2xs">
            <Clapperboard className="w-4 h-4 text-[#1A1A1A]" />
            <span>{parsed.title}</span>
          </div>
          <span className="h-px flex-1 max-w-[60px] bg-[#D1D1CF]" />
        </div>
      )}

      {/* PHASE 1: STAGING (S0) — PRE-PRODUCTION SETUP */}
      {parsed.stagingBlocks.length > 0 && (
        <div className="space-y-2" id="auteur-staging-section">
          <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-1.5">
            <span className="text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-wider text-[#666] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#1A1A1A] inline-block" />
              PHASE 1: STAGING (S₀) // PRE-PRODUCTION CONTEXT
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAllCollapse}
                className="text-[9px] md:text-[10px] font-mono font-bold text-[#666] hover:text-[#1A1A1A] uppercase tracking-wider px-1.5 py-0.5 hover:bg-[#EAEAE8] transition-colors cursor-pointer border border-transparent hover:border-[#D1D1CF]"
                title={allStagingCollapsed ? "Expand all staging blocks" : "Collapse all staging blocks"}
              >
                {allStagingCollapsed ? "[+] EXPAND ALL" : "[-] COLLAPSE ALL"}
              </button>
              <span className="text-[9px] md:text-[10px] font-mono font-bold text-[#666] uppercase tracking-wider bg-[#EAEAE8] px-1.5 py-0.5 border border-[#D1D1CF]">
                {parsed.stagingBlocks.length} {parsed.stagingBlocks.length === 1 ? "BLOCK" : "BLOCKS"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {parsed.stagingBlocks.map((sb) => {
              const isCollapsed = Boolean(collapsedBlocks[sb.name]);
              return (
                <div
                  key={sb.name}
                  className="bg-[#FAFAF9] border border-[#D1D1CF] hover:border-[#1A1A1A]/60 transition-colors"
                >
                  {/* Clean Block Header with Collapse/Expand Action */}
                  <div
                    onClick={() => toggleBlockCollapse(sb.name)}
                    className="flex items-center justify-between px-3 py-1.5 bg-[#F4F4F2] cursor-pointer select-none hover:bg-[#EAEAE8] transition-colors group"
                    title={isCollapsed ? `Expand [${sb.name}]` : `Collapse [${sb.name}]`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] md:text-xs font-bold uppercase tracking-widest bg-[#1A1A1A] text-white px-2 py-0.5 border border-[#1A1A1A] shrink-0">
                        [{sb.name}]
                      </span>
                      {isCollapsed && (
                        <span className="text-xs font-mono text-[#777] truncate italic">
                          {sb.lines[0]?.trim() || "Click to expand..."}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#666] group-hover:text-[#1A1A1A]">
                      <span>{isCollapsed ? "[+] EXPAND" : "[-]"}</span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-[#666] group-hover:text-[#1A1A1A]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#666] group-hover:text-[#1A1A1A]" />
                      )}
                    </div>
                  </div>

                  {/* Formatted Content (when not collapsed) */}
                  {!isCollapsed && (
                    <div className="p-3 border-t border-[#D1D1CF]/40">
                      {renderStagingBlockContent(sb, parsed.aestheticTokens, parsed.characterNames)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PHASE 2: EXECUTION (S1 -> Sn) — ROLLING CAMERA TIMELINE */}
      {macroStates.length > 0 && (
        <div className="space-y-1.5 pt-1" id="auteur-execution-section">
          <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-1.5">
            <span className="text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-wider text-[#666] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-600 inline-block animate-pulse" />
              PHASE 2: EXECUTION (S₁ → Sₙ) // ROLLING CAMERA TIMELINE
            </span>
            <span className="text-[9px] md:text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 uppercase tracking-wider font-bold">
              {macroStates.length} {macroStates.length === 1 ? "MACRO-STATE" : "MACRO-STATES"}
            </span>
          </div>

          <div className="space-y-1.5">
            {macroStates.map((ms, idx) => {
              const subStates = ms.subStates || ms.waterfallSteps || [];
              const lead = ms.leadAction || ms.leadStep || ms.rawLine;
              const totalSubStates = subStates.length + 1;

              return (
                <div
                  key={`ms-${idx}`}
                  className="bg-white border border-[#D1D1CF] hover:border-[#1A1A1A] p-2.5 transition-colors font-mono text-xs md:text-[12.5px] leading-relaxed shadow-2xs group"
                >
                  {/* Compact Header */}
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#D1D1CF]/30 text-[10px] text-[#777] leading-none">
                    <span className="font-bold text-[#1A1A1A] flex items-center gap-1">
                      <span className="text-[#888884]">MACRO-STATE</span> #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wide">
                      {totalSubStates} {totalSubStates === 1 ? "SUB-STATE" : "SUB-STATES"}
                    </span>
                  </div>

                  {/* Lead Action */}
                  <div className="text-[#1A1A1A] font-medium py-0.5">
                    {renderFormattedAuteurSegment(
                      lead,
                      parsed.aestheticTokens,
                      parsed.characterNames,
                      `ms-${idx}-lead`
                    )}
                  </div>

                  {/* Waterfall Sub-States */}
                  {subStates.length > 0 && (
                    <div className="mt-1 pl-3 space-y-0.5 border-l-2 border-[#EAEAE8] group-hover:border-[#1A1A1A]/30 transition-colors">
                      {subStates.map((step, sIdx) => (
                        <div key={`ms-${idx}-s-${sIdx}`} className="flex items-baseline gap-1.5 py-0.5">
                          <span className="text-[#888884] font-bold select-none shrink-0 font-mono text-[10.5px]">
                            →
                          </span>
                          <div className="flex-1 text-[#1A1A1A]">
                            {renderFormattedAuteurSegment(
                              step,
                              parsed.aestheticTokens,
                              parsed.characterNames,
                              `ms-${idx}-s-${sIdx}`
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
