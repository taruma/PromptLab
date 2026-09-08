"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FolderKanban,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Bookmark,
  History,
  Layers,
  Image as ImageIcon,
  Check,
  FileText,
  Terminal
} from "lucide-react";
import {
  Project,
  ProjectExportData,
  readAndValidateProjectJSON,
} from "../lib/projects";
import { useModalEscape } from "../hooks/use-modal-stack";

interface ProjectImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  existingProjects: Project[];
  onConfirmImport: (
    projectData: ProjectExportData,
    options: { customName?: string; switchToProject?: boolean }
  ) => Promise<void>;
}

export default function ProjectImportConfirmModal({
  isOpen,
  onClose,
  file,
  existingProjects = [],
  onConfirmImport,
}: ProjectImportConfirmModalProps) {
  // Register with global LIFO modal escape stack (Tier 3)
  useModalEscape(isOpen, onClose);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ProjectExportData | null>(null);

  // Form states
  const [projectName, setProjectName] = useState<string>("");
  const [projectDesc, setProjectDesc] = useState<string>("");
  const [switchToProject, setSwitchToProject] = useState<boolean>(true);
  const [activePromptTab, setActivePromptTab] = useState<"system" | "template">("system");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Parse and validate project file on open
  useEffect(() => {
    let active = true;

    if (!isOpen || !file) {
      return;
    }

    const parseFile = async () => {
      setLoading(true);
      setError(null);
      setParsedData(null);

      try {
        const result = await readAndValidateProjectJSON(file);
        if (!active) return;
        if (result.success && result.data) {
          const rawProject = result.data.project;
          setParsedData(result.data);

          // Determine initial name with collision resolution
          let initialName = rawProject.name || "Imported Project";
          if (existingProjects.some((p) => p.name.toLowerCase() === initialName.toLowerCase())) {
            let count = 1;
            while (
              existingProjects.some(
                (p) => p.name.toLowerCase() === `${rawProject.name || "Imported Project"} (${count})`.toLowerCase()
              )
            ) {
              count++;
            }
            initialName = `${rawProject.name || "Imported Project"} (${count})`;
          }
          setProjectName(initialName);
          setProjectDesc(rawProject.description || "");
        } else {
          setError(result.error || "Failed to parse project backup package.");
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "An unexpected error occurred while reading the file.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    parseFile();

    return () => {
      active = false;
    };
  }, [isOpen, file, existingProjects]);

  // Check if current name in input collides with existing projects
  const isNameCollision = useMemo(() => {
    if (!projectName.trim()) return false;
    return existingProjects.some(
      (p) => p.name.toLowerCase() === projectName.trim().toLowerCase()
    );
  }, [projectName, existingProjects]);

  if (!isOpen) return null;

  const project = parsedData?.project;
  const presetsCount = project?.customPresets?.length || 0;
  const historyCount = project?.history?.length || 0;
  const assetCount = project?.assetLibrary?.length || 0;

  // Derive total images count from v1.1 pool or v1.0 array
  const imageCount =
    parsedData?.imageCount !== undefined
      ? parsedData.imageCount
      : parsedData?.images
      ? Array.isArray(parsedData.images)
        ? parsedData.images.length
        : Object.keys(parsedData.images).length
      : 0;

  const handleConfirm = async () => {
    if (!parsedData || !projectName.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirmImport(parsedData, {
        customName: projectName.trim(),
        switchToProject,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to complete project workspace import.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-xs animate-fade-in"
      id="project-import-modal-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#F4F4F2] border-2 border-[#1A1A1A] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] rounded-none"
        id="project-import-modal-panel"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#D1D1CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-widest font-sans text-[#1A1A1A] truncate">
                Import Project Workspace
              </h3>
              <p className="text-[9px] font-mono text-[#888884] uppercase tracking-wider truncate">
                {file ? file.name : "Project Backup Package"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[#888884] hover:text-[#1A1A1A] transition-all cursor-pointer rounded-none shrink-0"
            title="Close (Escape)"
            id="close-project-import-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#888884]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#1A1A1A]" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
                Validating & Resolving Project Package...
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 rounded-none animate-fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-mono font-bold uppercase tracking-wider text-[10px]">Import Error</p>
                <p className="text-[11px] mt-1 leading-relaxed font-sans">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && parsedData && project && (
            <>
              {/* Summary Breakdown Metrics Ribbon */}
              <div className="grid grid-cols-4 gap-2 bg-white p-3 border border-[#D1D1CF] font-mono text-center">
                <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 pr-1">
                  <div className="flex items-center gap-1 text-[#888884] text-[8px] uppercase tracking-wider">
                    <Bookmark className="w-2.5 h-2.5" /> Presets
                  </div>
                  <span className="text-sm font-bold text-[#1A1A1A] mt-0.5">{presetsCount}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 px-1">
                  <div className="flex items-center gap-1 text-[#888884] text-[8px] uppercase tracking-wider">
                    <History className="w-2.5 h-2.5" /> History
                  </div>
                  <span className="text-sm font-bold text-[#1A1A1A] mt-0.5">{historyCount}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 px-1">
                  <div className="flex items-center gap-1 text-[#888884] text-[8px] uppercase tracking-wider">
                    <Layers className="w-2.5 h-2.5" /> Assets
                  </div>
                  <span className="text-sm font-bold text-[#1A1A1A] mt-0.5">{assetCount}</span>
                </div>
                <div className="flex flex-col items-center justify-center pl-1">
                  <div className="flex items-center gap-1 text-emerald-700 text-[8px] uppercase tracking-wider font-bold">
                    <ImageIcon className="w-2.5 h-2.5" /> Images
                  </div>
                  <span className="text-sm font-bold text-emerald-600 mt-0.5">{imageCount}</span>
                </div>
              </div>

              {/* Project Identity Configuration */}
              <div className="bg-white border border-[#D1D1CF] p-3.5 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Workspace Name
                    </label>
                    {isNameCollision && (
                      <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-300">
                        Name in use (will auto-suffix on save)
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#FAF9F6] border border-[#D1D1CF] focus:border-[#1A1A1A] focus:outline-none rounded-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Workspace purpose or notes..."
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#FAF9F6] border border-[#D1D1CF] focus:border-[#1A1A1A] focus:outline-none rounded-none"
                  />
                </div>
              </div>

              {/* Prompts Inspection Preview */}
              <div className="bg-white border border-[#D1D1CF] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between bg-[#F4F4F2] border-b border-[#D1D1CF] px-3 py-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#888884]">
                    Prompt Template Inspection
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[9px]">
                    <button
                      type="button"
                      onClick={() => setActivePromptTab("system")}
                      className={`px-2 py-0.5 uppercase tracking-wider transition-colors cursor-pointer ${
                        activePromptTab === "system"
                          ? "bg-[#1A1A1A] text-white font-bold"
                          : "text-[#888884] hover:text-[#1A1A1A]"
                      }`}
                    >
                      System Prompt ({project.systemPrompt ? project.systemPrompt.length : 0} chars)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePromptTab("template")}
                      className={`px-2 py-0.5 uppercase tracking-wider transition-colors cursor-pointer ${
                        activePromptTab === "template"
                          ? "bg-[#1A1A1A] text-white font-bold"
                          : "text-[#888884] hover:text-[#1A1A1A]"
                      }`}
                    >
                      Prompt Template ({project.promptTemplate ? project.promptTemplate.length : 0} chars)
                    </button>
                  </div>
                </div>

                <div className="p-3 max-h-36 overflow-y-auto font-mono text-[10px] leading-relaxed bg-[#FAF9F6] text-[#1A1A1A] whitespace-pre-wrap select-text">
                  {activePromptTab === "system" ? (
                    project.systemPrompt ? (
                      project.systemPrompt
                    ) : (
                      <span className="text-[#888884] italic">No custom system prompt configured.</span>
                    )
                  ) : project.promptTemplate ? (
                    project.promptTemplate
                  ) : (
                    <span className="text-[#888884] italic">No custom prompt template configured.</span>
                  )}
                </div>
              </div>

              {/* Options */}
              <label className="flex items-center gap-2 font-mono text-[10px] text-[#1A1A1A] cursor-pointer select-none bg-white p-2.5 border border-[#D1D1CF]">
                <input
                  type="checkbox"
                  checked={switchToProject}
                  onChange={(e) => setSwitchToProject(e.target.checked)}
                  className="rounded-none border-[#D1D1CF] text-[#1A1A1A] focus:ring-0 cursor-pointer"
                />
                <span className="uppercase font-bold tracking-wide">
                  Switch to this project workspace immediately after import
                </span>
              </label>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#D1D1CF] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[9px] font-mono text-[#888884] truncate">
            {parsedData?.exportedAt && (
              <span>Exported: {new Date(parsedData.exportedAt).toLocaleDateString()}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[9px] font-mono uppercase font-bold tracking-wider text-[#1A1A1A] transition-all cursor-pointer disabled:opacity-50 rounded-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !!error || !parsedData || !projectName.trim() || isSubmitting}
              className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white border border-[#1A1A1A] text-[9px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-none shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-white" />
                  <span>Importing Workspace...</span>
                </>
              ) : (
                <span>Confirm & Import Project</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
