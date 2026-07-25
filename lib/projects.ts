import { openDB, STORE_PROJECTS, STORE_NAME, getStoredImage, saveStoredImage, deleteStoredImage } from "./indexeddb";

export interface ProjectAsset {
  id: string;
  label: string;
  mimeType: string;
  createdAt?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  systemPrompt: string;
  promptTemplate: string;
  customPresets: any[];
  history: any[];
  assetLibrary: ProjectAsset[];
}

export interface ProjectExportData {
  version: "1.0";
  type: "promptlab_project";
  exportedAt: string;
  project: Project;
  images?: { id: string; base64: string }[];
}

export const CURRENT_PROJECT_KEY = "promptlab_current_project_id";
export const SYNC_CHANNEL_NAME = "promptlab_project_sync_channel";

/**
 * Get current active project ID from localStorage
 */
export function getCurrentProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}

/**
 * Set current active project ID in localStorage
 */
export function setCurrentProjectId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_PROJECT_KEY, id);
}

/**
 * Broadcast project state changes across browser tabs
 */
export function broadcastProjectChange(action: "switch" | "update" | "create" | "delete", projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ action, projectId, timestamp: Date.now() });
      channel.close();
    }
  } catch (err) {
    console.warn("BroadcastChannel postMessage failed:", err);
  }
}

/**
 * Subscribe to project state changes from other tabs
 */
export function subscribeProjectChanges(callback: (data: { action: string; projectId: string }) => void): () => void {
  if (typeof window === "undefined") return () => {};
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      const handler = (event: MessageEvent) => {
        if (event.data && event.data.action && event.data.projectId) {
          callback(event.data);
        }
      };
      channel.addEventListener("message", handler);
      return () => {
        channel.removeEventListener("message", handler);
        channel.close();
      };
    }
  } catch (err) {
    console.warn("BroadcastChannel setup failed:", err);
  }
  return () => {};
}

/**
 * Fetch all projects from IndexedDB
 */
export async function getAllProjects(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PROJECTS, "readonly");
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const projects = (request.result || []) as Project[];
      // Sort by updatedAt descending
      projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(projects);
    };
  });
}

/**
 * Get project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PROJECTS, "readonly");
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as Project) || null);
    };
  });
}

/**
 * Save / Update project in IndexedDB
 */
export async function saveProject(project: Project): Promise<void> {
  const db = await openDB();
  project.updatedAt = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PROJECTS, "readwrite");
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.put(project);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Delete project from IndexedDB
 */
export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PROJECTS, "readwrite");
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Sync project data to localStorage so child components read/write the current active project
 */
export function syncActiveProjectToLocalStorage(project: Project): void {
  if (typeof window === "undefined") return;
  try {
    setCurrentProjectId(project.id);
    if (project.systemPrompt !== undefined) {
      localStorage.setItem("prompt_generator_system_prompt", project.systemPrompt);
    }
    if (project.promptTemplate !== undefined) {
      localStorage.setItem("prompt_generator_prompt_template", project.promptTemplate);
    }
    if (project.customPresets) {
      localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(project.customPresets));
    }
    if (project.history) {
      localStorage.setItem("prompt_generator_history_v1", JSON.stringify(project.history));
    }
    if (project.assetLibrary) {
      localStorage.setItem("prompt_generator_library_images", JSON.stringify(project.assetLibrary));
    }
    // Trigger custom window event so listeners in the current tab can update if needed
    window.dispatchEvent(new CustomEvent("promptlab_project_switched", { detail: { projectId: project.id } }));
  } catch (err) {
    console.error("Failed to sync project to localStorage", err);
  }
}

/**
 * Initialize multi-project system with backward-compatibility migration
 */
export async function initProjects(defaultSystemPrompt: string = "", defaultPromptTemplate: string = ""): Promise<{ projects: Project[]; activeProject: Project }> {
  let projects = await getAllProjects();

  if (projects.length === 0) {
    // Migration: Collect existing legacy localStorage data
    let existingCustomPresets: any[] = [];
    let existingHistory: any[] = [];
    let existingAssetLibrary: ProjectAsset[] = [];
    let existingSystemPrompt = defaultSystemPrompt;
    let existingPromptTemplate = defaultPromptTemplate;

    try {
      const p = localStorage.getItem("prompt_generator_custom_presets");
      if (p) existingCustomPresets = JSON.parse(p);
    } catch (_) {}

    try {
      const h = localStorage.getItem("prompt_generator_history_v1");
      if (h) existingHistory = JSON.parse(h);
    } catch (_) {}

    try {
      const a = localStorage.getItem("prompt_generator_library_images");
      if (a) existingAssetLibrary = JSON.parse(a);
    } catch (_) {}

    try {
      const sp = localStorage.getItem("prompt_generator_system_prompt");
      if (sp) existingSystemPrompt = sp;
    } catch (_) {}

    try {
      const pt = localStorage.getItem("prompt_generator_prompt_template");
      if (pt) existingPromptTemplate = pt;
    } catch (_) {}

    const now = new Date().toISOString();
    const defaultProject: Project = {
      id: `proj_${Date.now()}_default`,
      name: "Main Workspace",
      description: "Default project containing your current session configuration, presets, history, and assets.",
      createdAt: now,
      updatedAt: now,
      systemPrompt: existingSystemPrompt,
      promptTemplate: existingPromptTemplate,
      customPresets: existingCustomPresets,
      history: existingHistory,
      assetLibrary: existingAssetLibrary,
    };

    await saveProject(defaultProject);
    projects = [defaultProject];
  }

  let activeId = getCurrentProjectId();
  let activeProject = projects.find((p) => p.id === activeId);

  if (!activeProject) {
    activeProject = projects[0];
    activeId = activeProject.id;
  }

  syncActiveProjectToLocalStorage(activeProject);
  return { projects, activeProject };
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  description: string = "",
  options?: {
    systemPrompt?: string;
    promptTemplate?: string;
    copyFromCurrent?: boolean;
    currentProject?: Project;
  }
): Promise<Project> {
  const now = new Date().toISOString();
  const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let systemPrompt = options?.systemPrompt || "";
  let promptTemplate = options?.promptTemplate || "";
  let customPresets: any[] = [];
  let history: any[] = [];
  let assetLibrary: ProjectAsset[] = [];

  if (options?.copyFromCurrent && options.currentProject) {
    systemPrompt = options.currentProject.systemPrompt;
    promptTemplate = options.currentProject.promptTemplate;
    customPresets = JSON.parse(JSON.stringify(options.currentProject.customPresets || []));
    assetLibrary = JSON.parse(JSON.stringify(options.currentProject.assetLibrary || []));
    // History is omitted for fresh workspace, or selectively copied
  }

  const newProject: Project = {
    id: newId,
    name: name.trim() || "Untitled Project",
    description: description.trim(),
    createdAt: now,
    updatedAt: now,
    systemPrompt,
    promptTemplate,
    customPresets,
    history,
    assetLibrary,
  };

  await saveProject(newProject);
  return newProject;
}

/**
 * Export project as downloadable JSON file (including base64 images from IndexedDB)
 */
export async function exportProjectJSON(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  // Fetch base64 data for all assetLibrary images
  const images: { id: string; base64: string }[] = [];
  if (project.assetLibrary && project.assetLibrary.length > 0) {
    for (const asset of project.assetLibrary) {
      try {
        const b64 = await getStoredImage(asset.id);
        if (b64) {
          images.push({ id: asset.id, base64: b64 });
        }
      } catch (err) {
        console.warn(`Failed to retrieve image ${asset.id} for export`, err);
      }
    }
  }

  const exportPayload: ProjectExportData = {
    version: "1.0",
    type: "promptlab_project",
    exportedAt: new Date().toISOString(),
    project,
    images,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const sanitizeName = project.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "project";
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);
  const filename = `PromptLab-Project-${sanitizeName}_${dateStr}_${timeStr}_${uniqueId}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import project from JSON file content
 */
export async function importProjectJSON(jsonString: string): Promise<Project> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error("Invalid JSON file formatting.");
  }

  if (parsed.type !== "promptlab_project" || !parsed.project) {
    throw new Error("File is not a valid PromptLab Project export file.");
  }

  const rawProject = parsed.project as Project;
  const existingProjects = await getAllProjects();

  // Handle name collisions
  let finalName = rawProject.name || "Imported Project";
  let count = 1;
  while (existingProjects.some((p) => p.name.toLowerCase() === finalName.toLowerCase())) {
    finalName = `${rawProject.name || "Imported Project"} (${count++})`;
  }

  const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const importedProject: Project = {
    id: newId,
    name: finalName,
    description: rawProject.description ? `${rawProject.description} (Imported)` : "Imported project workspace.",
    createdAt: now,
    updatedAt: now,
    systemPrompt: rawProject.systemPrompt || "",
    promptTemplate: rawProject.promptTemplate || "",
    customPresets: Array.isArray(rawProject.customPresets) ? rawProject.customPresets : [],
    history: Array.isArray(rawProject.history) ? rawProject.history : [],
    assetLibrary: Array.isArray(rawProject.assetLibrary) ? rawProject.assetLibrary : [],
  };

  // Restore images into IndexedDB "images" store
  if (Array.isArray(parsed.images)) {
    for (const img of parsed.images) {
      if (img.id && img.base64) {
        try {
          await saveStoredImage(img.id, img.base64);
        } catch (err) {
          console.warn(`Failed to restore image ${img.id} on import`, err);
        }
      }
    }
  }

  await saveProject(importedProject);
  return importedProject;
}
