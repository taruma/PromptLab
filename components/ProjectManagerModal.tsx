"use client";

import React, { useState, useRef } from "react";
import {
  FolderKanban,
  X,
  Plus,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Search,
  Clock,
  Layers,
  FileText,
  Star,
  LayoutGrid,
  List
} from "lucide-react";
import {
  Project,
  createProject,
  exportProjectJSON,
  importProjectJSON,
  deleteProject,
  saveProject
} from "../lib/projects";
import { formatPresetDateShort } from "../lib/utils";

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProject: Project | null;
  hasActiveSessionData: boolean;
  defaultSystemPrompt?: string;
  defaultPromptTemplate?: string;
  onSwitchProject: (projectId: string) => Promise<void>;
  onProjectsUpdated: () => Promise<void>;
}

export default function ProjectManagerModal({
  isOpen,
  onClose,
  projects = [],
  activeProject,
  hasActiveSessionData,
  defaultSystemPrompt = "",
  defaultPromptTemplate = "",
  onSwitchProject,
  onProjectsUpdated,
}: ProjectManagerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "compact">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prompt_generator_project_view_mode");
      if (saved === "compact" || saved === "grid") return saved;
    }
    return "grid";
  });
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSetViewMode = (mode: "grid" | "compact") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("prompt_generator_project_view_mode", mode);
    }
  };

  // Switch confirmation state
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);

  // New project creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [copyWithAssets, setCopyWithAssets] = useState(false);

  // Editing existing project state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Delete confirmation state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredProjects = projects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aIsActive = activeProject && a.id === activeProject.id;
      const bIsActive = activeProject && b.id === activeProject.id;
      if (aIsActive) return -1;
      if (bIsActive) return 1;

      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRequestSwitch = (targetId: string) => {
    if (activeProject && targetId === activeProject.id) return;
    setPendingSwitchId(targetId);
  };

  const executeSwitch = async (targetId: string) => {
    try {
      await onSwitchProject(targetId);
      setPendingSwitchId(null);
      showToast("success", "Switched active project workspace");
      onClose();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to switch project");
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const created = await createProject(newName, newDesc, {
        copyFromCurrent: copyWithAssets,
        currentProject: activeProject || undefined,
        systemPrompt: copyWithAssets ? (activeProject?.systemPrompt || defaultSystemPrompt) : defaultSystemPrompt,
        promptTemplate: copyWithAssets ? (activeProject?.promptTemplate || defaultPromptTemplate) : defaultPromptTemplate,
      });
      setIsCreating(false);
      setNewName("");
      setNewDesc("");
      setCopyWithAssets(false);
      await onProjectsUpdated();
      showToast("success", `Project "${created.name}" created.`);
      // Prompt switch
      handleRequestSwitch(created.id);
    } catch (err: any) {
      showToast("error", err?.message || "Failed to create project");
    }
  };

  const handleStartEdit = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDesc(p.description || "");
  };

  const handleSaveEdit = async (p: Project) => {
    if (!editName.trim()) return;
    try {
      p.name = editName.trim();
      p.description = editDesc.trim();
      await saveProject(p);
      setEditingId(null);
      await onProjectsUpdated();
      showToast("success", "Project updated");
    } catch (err: any) {
      showToast("error", "Failed to update project");
    }
  };

  const handleExport = async (projectId: string) => {
    try {
      await exportProjectJSON(projectId);
      showToast("success", "Project exported as JSON bundle");
    } catch (err: any) {
      showToast("error", err?.message || "Failed to export project");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = await importProjectJSON(text);
      await onProjectsUpdated();
      showToast("success", `Project "${imported.name}" imported successfully.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      showToast("error", err?.message || "Invalid project JSON file");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteProject(id);
      setPendingDeleteId(null);
      await onProjectsUpdated();
      showToast("success", "Project deleted");
    } catch (err: any) {
      showToast("error", "Failed to delete project");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#F4F4F2] border-2 border-[#1A1A1A] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-none">
        {/* Header Bar */}
        <div className="p-4 md:p-5 bg-white border-b border-[#D1D1CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-[#1A1A1A]">
                PROJECT WORKSPACE MANAGER
              </h2>
              {activeProject && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-mono text-[#888884] uppercase">
                    ACTIVE PROJECT: <strong className="text-[#1A1A1A]">{activeProject.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#888884] hover:text-[#1A1A1A] hover:bg-[#F4F4F2] transition-colors cursor-pointer"
            title="Close Manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border-b transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            {statusMessage.text}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="p-4 bg-white/70 border-b border-[#D1D1CF] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#888884] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="SEARCH PROJECTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#D1D1CF] pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#D1D1CF] bg-[#F4F4F2] p-0.5">
              <button
                type="button"
                onClick={() => handleSetViewMode("grid")}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title="Grid View (Detailed Cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode("compact")}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "compact"
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title="Compact List View (Easier navigation for multiple projects)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compact</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white hover:bg-[#F4F4F2] text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Import project JSON file"
            >
              <Upload className="w-3.5 h-3.5 text-[#1A1A1A]" />
              Import Project
            </button>

            <button
              onClick={() => {
                setIsCreating(true);
                setNewName("");
                setNewDesc("");
              }}
              className="px-3 py-1.5 bg-[#1A1A1A] text-white hover:bg-black text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Create New Project Inline Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateNew}
              className="p-4 bg-white border-2 border-[#1A1A1A] space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-2">
                <h3 className="text-xs font-bold font-mono uppercase text-[#1A1A1A] flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#1A1A1A]" />
                  Create New Project Workspace
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#888884] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#888884] mb-1">
                    PROJECT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyberpunk Film Script or Product Copywriting"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#D1D1CF] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#888884] mb-1">
                    DESCRIPTION (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of this project workspace"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#D1D1CF] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                {activeProject && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#1A1A1A] pt-1">
                    <input
                      type="checkbox"
                      checked={copyWithAssets}
                      onChange={(e) => setCopyWithAssets(e.target.checked)}
                      className="rounded-none border-[#D1D1CF] text-[#1A1A1A] focus:ring-0"
                    />
                    <span>Copy system prompt, prompt template & custom presets from current project</span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D1D1CF]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 border border-[#D1D1CF] text-[11px] font-bold uppercase tracking-wider hover:bg-[#F4F4F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black"
                >
                  Create & Switch
                </button>
              </div>
            </form>
          )}

          {/* Project Cards List */}
          {filteredProjects.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-[#D1D1CF] bg-white">
              <FolderKanban className="w-10 h-10 text-[#888884] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-mono text-[#888884] uppercase">NO PROJECTS FOUND</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((p) => {
                const isActive = activeProject && activeProject.id === p.id;
                const isEditing = editingId === p.id;

                const presetsCount = Array.isArray(p.customPresets) ? p.customPresets.length : 0;
                const historyCount = Array.isArray(p.history) ? p.history.length : 0;
                const assetsCount = Array.isArray(p.assetLibrary) ? p.assetLibrary.length : 0;

                const favPresetsCount = Array.isArray(p.customPresets)
                  ? p.customPresets.filter((item: any) => item?.isFavorite || item?.favorite).length
                  : 0;
                const favHistoryCount = Array.isArray(p.history)
                  ? p.history.filter((item: any) => item?.isFavorite || item?.favorite).length
                  : 0;

                return (
                  <div
                    key={p.id}
                    className={`transition-all p-3.5 flex flex-col justify-between border-2 ${
                      isActive
                        ? "bg-emerald-50/50 border-emerald-600 shadow-md ring-1 ring-emerald-600"
                        : "bg-white border-[#D1D1CF] hover:border-[#888884]"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#F4F4F2] border border-[#1A1A1A] px-2 py-1 text-xs font-mono font-bold"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Project description"
                          className="w-full bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-1 text-xs font-mono"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 border border-[#D1D1CF] text-[10px] font-mono uppercase cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(p)}
                            className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-mono uppercase font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Top Meta: Title & Description */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-black uppercase tracking-tight text-[#1A1A1A] line-clamp-1">
                              {p.name}
                            </h3>
                            {isActive ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold uppercase tracking-wider border border-emerald-300 shrink-0">
                                ACTIVE
                              </span>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="p-1 text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
                                title="Rename project"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] font-mono text-[#888884] line-clamp-2 min-h-[30px] mb-2.5 leading-snug">
                            {p.description || "No description provided."}
                          </p>

                          {/* Dates Row: Created & Last Update */}
                          <div className={`flex items-center justify-between gap-1 text-[10px] font-mono text-[#888884] mb-2.5 py-1 px-2 border ${
                            isActive
                              ? "bg-emerald-100/60 border-emerald-200"
                              : "bg-[#F4F4F2] border-[#EAEAE8]"
                          }`}>
                            <div className="flex items-center gap-1 overflow-hidden" title="Created date">
                              <Clock className="w-3 h-3 text-[#888884] shrink-0" />
                              <span className="truncate">
                                CREATED: <strong className="text-[#1A1A1A]">{formatPresetDateShort(p.createdAt || p.updatedAt)}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1 overflow-hidden" title="Last updated date">
                              <Clock className="w-3 h-3 text-[#888884] shrink-0" />
                              <span className="truncate">
                                UPDATED: <strong className="text-[#1A1A1A]">{formatPresetDateShort(p.updatedAt)}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Compact Single-Row Totals & Minor Details */}
                          <div className={`grid grid-cols-3 border py-2 px-1 text-[10px] font-mono mb-2 ${
                            isActive
                              ? "bg-emerald-100/60 border-emerald-200 divide-x divide-emerald-200"
                              : "bg-[#F4F4F2] border-[#D1D1CF] divide-x divide-[#D1D1CF]"
                          }`}>
                            <div className="flex items-center justify-center gap-1.5 px-0.5 leading-none" title={`Presets: ${presetsCount} total, ${favPresetsCount} favorite`}>
                              <span className="text-[#888884] uppercase font-bold text-[9px] tracking-tight">PRESETS</span>
                              <strong className="text-[#1A1A1A] text-[11px] font-black">{presetsCount}</strong>
                              <span className="text-amber-700 font-bold flex items-center gap-0.5 text-[10px] leading-none">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                                <span>{favPresetsCount}</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 px-0.5 leading-none" title={`History: ${historyCount} total, ${favHistoryCount} favorite`}>
                              <span className="text-[#888884] uppercase font-bold text-[9px] tracking-tight">HISTORY</span>
                              <strong className="text-[#1A1A1A] text-[11px] font-black">{historyCount}</strong>
                              <span className="text-amber-700 font-bold flex items-center gap-0.5 text-[10px] leading-none">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                                <span>{favHistoryCount}</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 px-0.5 leading-none" title={`Assets: ${assetsCount} total`}>
                              <span className="text-[#888884] uppercase font-bold text-[9px] tracking-tight">ASSETS</span>
                              <strong className="text-[#1A1A1A] text-[11px] font-black">{assetsCount}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className={`flex items-center justify-between gap-2 pt-2.5 border-t mt-auto ${
                          isActive ? "border-emerald-200" : "border-[#D1D1CF]"
                        }`}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleExport(p.id)}
                              className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2] transition-colors cursor-pointer"
                              title="Export project JSON bundle"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {projects.length > 1 && !isActive && (
                              <button
                                onClick={() => setPendingDeleteId(p.id)}
                                className="p-1.5 border border-red-200 hover:border-red-600 bg-white text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {isActive ? (
                            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> CURRENT WORKSPACE
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestSwitch(p.id)}
                              className="px-3 py-1 bg-[#1A1A1A] text-white hover:bg-black text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              SWITCH WORKSPACE
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact Rows View for Multiple Projects */
            <div className="flex flex-col gap-2">
              {filteredProjects.map((p) => {
                const isActive = activeProject && activeProject.id === p.id;
                const isEditing = editingId === p.id;

                const presetsCount = Array.isArray(p.customPresets) ? p.customPresets.length : 0;
                const historyCount = Array.isArray(p.history) ? p.history.length : 0;
                const assetsCount = Array.isArray(p.assetLibrary) ? p.assetLibrary.length : 0;

                const favPresetsCount = Array.isArray(p.customPresets)
                  ? p.customPresets.filter((item: any) => item?.isFavorite || item?.favorite).length
                  : 0;
                const favHistoryCount = Array.isArray(p.history)
                  ? p.history.filter((item: any) => item?.isFavorite || item?.favorite).length
                  : 0;

                return (
                  <div
                    key={p.id}
                    className={`transition-all p-2.5 sm:p-3 border-2 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isActive
                        ? "bg-emerald-50/50 border-emerald-600 shadow-sm ring-1 ring-emerald-600"
                        : "bg-white border-[#D1D1CF] hover:border-[#888884]"
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 w-full bg-[#F4F4F2] border border-[#1A1A1A] px-2 py-1 text-xs font-mono font-bold"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Project description"
                          className="flex-1 w-full bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-1 text-xs font-mono"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 border border-[#D1D1CF] text-[10px] font-mono uppercase cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(p)}
                            className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-mono uppercase font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Title & Description */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                              }`}
                            />
                            <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-[#1A1A1A] truncate">
                              {p.name}
                            </h3>
                            {isActive && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[8px] font-mono font-bold uppercase tracking-wider border border-emerald-300 shrink-0">
                                ACTIVE
                              </span>
                            )}
                            {!isActive && (
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="p-0.5 text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
                                title="Rename project"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-[#888884] truncate">
                            {p.description || "No description provided."}
                          </p>
                        </div>

                        {/* Mid Meta: Stats Badges & Date */}
                        <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono shrink-0">
                          <div
                            className="flex items-center gap-1 px-2 py-1 bg-[#F4F4F2] border border-[#D1D1CF]"
                            title={`Presets: ${presetsCount} total, ${favPresetsCount} favorite`}
                          >
                            <span className="text-[#888884] uppercase font-bold text-[9px]">P:</span>
                            <strong className="text-[#1A1A1A]">{presetsCount}</strong>
                            <span className="text-amber-700 font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                              <span>{favPresetsCount}</span>
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-1 px-2 py-1 bg-[#F4F4F2] border border-[#D1D1CF]"
                            title={`History: ${historyCount} total, ${favHistoryCount} favorite`}
                          >
                            <span className="text-[#888884] uppercase font-bold text-[9px]">H:</span>
                            <strong className="text-[#1A1A1A]">{historyCount}</strong>
                            <span className="text-amber-700 font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                              <span>{favHistoryCount}</span>
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-1 px-2 py-1 bg-[#F4F4F2] border border-[#D1D1CF]"
                            title={`Assets: ${assetsCount} total`}
                          >
                            <span className="text-[#888884] uppercase font-bold text-[9px]">A:</span>
                            <strong className="text-[#1A1A1A]">{assetsCount}</strong>
                          </div>

                          <div className="hidden lg:flex items-center gap-1 text-[#888884] px-1.5 py-1" title="Last updated">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{formatPresetDateShort(p.updatedAt)}</span>
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 justify-end border-t md:border-t-0 pt-2 md:pt-0 border-[#D1D1CF]">
                          <button
                            onClick={() => handleExport(p.id)}
                            className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2] transition-colors cursor-pointer"
                            title="Export project JSON bundle"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {projects.length > 1 && !isActive && (
                            <button
                              onClick={() => setPendingDeleteId(p.id)}
                              className="p-1.5 border border-red-200 hover:border-red-600 bg-white text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isActive ? (
                            <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Current
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestSwitch(p.id)}
                              className="px-3 py-1 bg-[#1A1A1A] text-white hover:bg-black text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer shadow-xs"
                            >
                              Switch
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation Modal for Switch Workspace */}
        {pendingSwitchId && (() => {
          const targetProject = projects.find((p) => p.id === pendingSwitchId);
          return (
            <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border-2 border-[#1A1A1A] max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-amber-600 font-black uppercase text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>CONFIRM WORKSPACE SWITCH</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-mono text-[#1A1A1A] leading-relaxed">
                    Are you sure you want to switch to project workspace{" "}
                    <strong className="underline decoration-2">{targetProject?.name || "Selected Project"}</strong>?
                  </p>
                  <p className="text-xs font-mono text-[#888884] leading-relaxed">
                    Switching project workspaces will load its system prompt, prompt template, custom presets, and history, and <strong>clear your active input session</strong> (main objective, inputs, and uploaded media).
                  </p>
                  {activeProject && (
                    <div className="p-2.5 bg-[#F4F4F2] border border-[#D1D1CF] text-[10px] font-mono text-[#1A1A1A] space-y-1">
                      <div>CURRENT WORKSPACE: <strong>{activeProject.name}</strong></div>
                      <div>TARGET WORKSPACE: <strong>{targetProject?.name || "Selected Project"}</strong></div>
                    </div>
                  )}
                  <p className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> All saved project data (presets, history, asset library) is safely preserved.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D1D1CF]">
                  <button
                    onClick={() => setPendingSwitchId(null)}
                    className="px-3 py-1.5 border border-[#D1D1CF] text-[11px] font-bold uppercase hover:bg-[#F4F4F2] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => executeSwitch(pendingSwitchId)}
                    className="px-4 py-1.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase hover:bg-black cursor-pointer"
                  >
                    Proceed & Switch
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Confirmation Modal for Delete Project */}
        {pendingDeleteId && (
          <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-red-600 max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-red-600 font-black uppercase text-sm">
                <Trash2 className="w-5 h-5" />
                <span>DELETE PROJECT</span>
              </div>
              <p className="text-xs font-mono text-[#1A1A1A] leading-relaxed">
                Are you sure you want to permanently delete this project workspace and all its stored custom presets, history records, and asset library entries?
              </p>
              <p className="text-[11px] font-mono text-red-600 font-bold uppercase">
                THIS ACTION CANNOT BE UNDONE.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D1D1CF]">
                <button
                  onClick={() => setPendingDeleteId(null)}
                  className="px-3 py-1.5 border border-[#D1D1CF] text-[11px] font-bold uppercase hover:bg-[#F4F4F2]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConfirm(pendingDeleteId)}
                  className="px-4 py-1.5 bg-red-600 text-white text-[11px] font-bold uppercase hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
