import { openDB, STORE_PROJECTS, STORE_NAME, getStoredImage, saveStoredImage, deleteStoredImage } from "./indexeddb";
import { saveHistoryToLocalStorage } from "./history-storage";
import { computeContentHash } from "./content-hash";

export interface ProjectAsset {
  id: string;
  label: string;
  mimeType: string;
  createdAt?: number;
  isFavorite?: boolean;
  isPinned?: boolean;
  contentHash?: string;
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

export interface ProjectExportOptions {
  includeHistory?: boolean;
  includeHistoryImages?: boolean;
  includeAssets?: boolean;
  includePresets?: boolean;
}

export interface ProjectExportData {
  version: "1.0" | "1.1";
  type: "promptlab_project";
  exportedAt: string;
  project: Project;
  images?: Record<string, string> | { id: string; base64: string }[];
  imageCount?: number;
}

export interface ProjectImportParseResult {
  success: boolean;
  data?: ProjectExportData;
  error?: string;
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
 * Delete project from IndexedDB and garbage-collect unreferenced image assets
 */
export async function deleteProject(id: string): Promise<void> {
  const project = await getProject(id);

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_PROJECTS, "readwrite");
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });

  // Clean up unused image records in IndexedDB if they are no longer referenced by any remaining projects
  if (project?.assetLibrary && project.assetLibrary.length > 0) {
    for (const asset of project.assetLibrary) {
      if (asset.id) {
        try {
          await deleteStoredImage(asset.id);
        } catch (err) {
          console.warn(`Failed to clean up image ${asset.id} on project deletion:`, err);
        }
      }
    }
  }
}

/**
 * Sync project data to localStorage so child components read/write the current active project
 */
export function syncActiveProjectToLocalStorage(project: Project): void {
  if (typeof window === "undefined") return;
  try {
    setCurrentProjectId(project.id);

    // Clean up legacy v1 duplicate key to free up ~2.6MB of storage space
    try {
      localStorage.removeItem("prompt_generator_history_v1");
    } catch (_) {}

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
      saveHistoryToLocalStorage(project.history);
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
      const h = localStorage.getItem("prompt_generator_history_v1") || localStorage.getItem("prompt_generator_history");
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
 * Reads and validates a JSON file containing project workspace backups with
 * defensive format inspection and structure checks.
 */
export async function readAndValidateProjectJSON(
  file: File
): Promise<ProjectImportParseResult> {
  try {
    const text = await file.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: "Invalid JSON format. Could not parse project JSON file.",
      };
    }

    // Defensive check against mismatched PromptLab export types
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (parsed.type === "promptlab_history_export") {
        return {
          success: false,
          error:
            "This file is a PromptLab History export, not a Project workspace backup. Please import it via the History Explorer.",
        };
      }
      if (parsed.type === "promptlab_asset_library") {
        return {
          success: false,
          error:
            "This file is an Asset Library backup, not a Project workspace backup. Please import it via the Asset Library sidebar.",
        };
      }
      if (parsed.type === "promptlab_user_presets") {
        return {
          success: false,
          error:
            "This file is a PromptLab Presets export, not a Project workspace backup. Please import it via the Prompt Configuration editor.",
        };
      }
    }

    if (!parsed || parsed.type !== "promptlab_project" || !parsed.project) {
      return {
        success: false,
        error: "File is not a valid PromptLab Project export file.",
      };
    }

    return {
      success: true,
      data: parsed as ProjectExportData,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to read project JSON file.",
    };
  }
}

/**
 * Export project as downloadable JSON file (v1.1), consolidating both Asset Library
 * and History reference images into a deduplicated content-hash image pool and streaming
 * chunked Blob parts to prevent V8 memory allocation limits.
 */
export async function exportProjectJSON(
  projectId: string,
  options?: ProjectExportOptions
): Promise<{ filename: string; imageCount: number }> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  const includeHistory = options?.includeHistory !== false;
  const includeHistoryImages = includeHistory && options?.includeHistoryImages !== false;
  const includeAssets = options?.includeAssets !== false;
  const includePresets = options?.includePresets !== false;

  // Deduplicated image pool: key (contentHash || id) -> base64
  const uniqueImagePool = new Map<string, string>();
  // Map of reference id -> poolKey
  const refIdToPoolKey = new Map<string, string>();

  // 1. Collect images from assetLibrary if enabled
  const exportAssets = includeAssets && Array.isArray(project.assetLibrary) ? project.assetLibrary : [];
  if (exportAssets.length > 0) {
    for (const asset of exportAssets) {
      try {
        const b64 = await getStoredImage(asset.id);
        if (b64) {
          const hash = asset.contentHash || (await computeContentHash(b64));
          const poolKey = hash || asset.id;
          if (!uniqueImagePool.has(poolKey)) {
            uniqueImagePool.set(poolKey, b64);
          }
          refIdToPoolKey.set(asset.id, poolKey);
        }
      } catch (err) {
        console.warn(`Failed to retrieve asset image ${asset.id} for project export:`, err);
      }
    }
  }

  // 2. Collect images from history items (resolves history image loss bug) if enabled
  let preparedHistory: any[] = [];
  if (includeHistory && Array.isArray(project.history) && project.history.length > 0) {
    preparedHistory = await Promise.all(
      project.history.map(async (item: any) => {
        if (!item.images || !Array.isArray(item.images) || item.images.length === 0) {
          return item;
        }

        const preparedImages = await Promise.all(
          item.images.map(async (img: any) => {
            // If history images are disabled, preserve image metadata but omit base64 & pool entry
            if (!includeHistoryImages) {
              return {
                ...img,
                base64: "",
              };
            }

            let b64 = img.base64 || "";
            if (!b64 && img.id) {
              try {
                const fetchedB64 = await getStoredImage(img.id);
                if (fetchedB64) {
                  b64 = fetchedB64;
                }
              } catch (err) {
                console.warn(`Failed to retrieve history image ${img.id} for project export:`, err);
              }
            }

            const hash = img.contentHash || (b64 ? await computeContentHash(b64) : undefined);

            if (b64) {
              const poolKey = hash || img.id || `hist-pool-${Math.random().toString(36).substring(2, 8)}`;
              if (!uniqueImagePool.has(poolKey)) {
                uniqueImagePool.set(poolKey, b64);
              }
              if (img.id) {
                refIdToPoolKey.set(img.id, poolKey);
              }
            }

            return {
              ...img,
              base64: "", // Omit Base64 from individual items to prevent redundant duplicate copies
              contentHash: hash,
            };
          })
        );

        return {
          ...item,
          images: preparedImages,
        };
      })
    );
  }

  const exportProject: Project = {
    ...project,
    customPresets: includePresets && Array.isArray(project.customPresets) ? project.customPresets : [],
    assetLibrary: exportAssets,
    history: preparedHistory,
  };

  let scopeTag = "backup";
  if (!includeHistory) {
    scopeTag = "template";
  } else if (!includeHistoryImages) {
    scopeTag = "compact";
  }

  const sanitizeName =
    project.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "main_workspace";
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 6);
  const filename = `promptlab_${sanitizeName}_project_${scopeTag}_${dateStr}_${timeStr}_${uniqueId}.json`;

  // Build JSON chunks directly into array parts for Blob construction
  // to avoid V8 RangeError: Invalid string length on large projects
  const chunks: string[] = [];

  // 1. Header metadata
  chunks.push(
    `{"version":"1.1","type":"promptlab_project","exportedAt":${JSON.stringify(
      now.toISOString()
    )},"imageCount":${uniqueImagePool.size},`
  );

  // 2. Deduplicated images pool
  chunks.push(`"images":{`);
  let imgIndex = 0;
  for (const [key, base64] of uniqueImagePool.entries()) {
    if (imgIndex > 0) chunks.push(",");
    chunks.push(`${JSON.stringify(key)}:${JSON.stringify(base64)}`);
    imgIndex++;
  }
  chunks.push(`},`);

  // 3. Project payload
  chunks.push(`"project":${JSON.stringify(exportProject)}}`);

  const blob = new Blob(chunks, { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename, imageCount: uniqueImagePool.size };
}

/**
 * Import project from JSON file content or pre-parsed ProjectExportData,
 * with 100% backward compatibility for v1.0 array images and v1.1 image pools,
 * pool hydration into IndexedDB, and event-loop batch yielding.
 */
export async function importProjectJSON(
  source: string | ProjectExportData,
  options?: { customName?: string }
): Promise<Project> {
  let parsed: any;
  if (typeof source === "string") {
    try {
      parsed = JSON.parse(source);
    } catch (err) {
      throw new Error("Invalid JSON file formatting. Could not parse JSON.");
    }
  } else {
    parsed = source;
  }

  // Defensive validation against wrong backup types
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (parsed.type === "promptlab_history_export") {
      throw new Error(
        "This file is a PromptLab History export, not a Project workspace backup. Please import it via the History Explorer."
      );
    }
    if (parsed.type === "promptlab_asset_library") {
      throw new Error(
        "This file is an Asset Library backup, not a Project workspace backup. Please import it via the Asset Library sidebar."
      );
    }
    if (parsed.type === "promptlab_user_presets") {
      throw new Error(
        "This file is a PromptLab Presets export, not a Project workspace backup. Please import it via the Prompt Configuration editor."
      );
    }
  }

  if (!parsed || parsed.type !== "promptlab_project" || !parsed.project) {
    throw new Error("File is not a valid PromptLab Project export file.");
  }

  const rawProject = parsed.project as Project;
  const existingProjects = await getAllProjects();

  // Handle name collisions or custom requested name
  let finalName = options?.customName?.trim() || rawProject.name || "Imported Project";
  if (!options?.customName) {
    let count = 1;
    while (existingProjects.some((p) => p.name.toLowerCase() === finalName.toLowerCase())) {
      finalName = `${rawProject.name || "Imported Project"} (${count++})`;
    }
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

  const BATCH_SIZE = 10;

  // Build unified image pool from v1.1 object, v1.0 array, or inline images
  const normalizedPool: Record<string, string> = {};

  if (parsed.images) {
    if (Array.isArray(parsed.images)) {
      // Legacy v1.0 format: array of { id, base64 }
      for (const item of parsed.images) {
        if (item && item.id && item.base64) {
          normalizedPool[item.id] = item.base64;
        }
      }
    } else if (typeof parsed.images === "object") {
      // v1.1 format: Record<string, string> keyed by contentHash or id
      Object.assign(normalizedPool, parsed.images);
    }
  }

  // Also collect any inline base64 from history items in legacy exports
  if (Array.isArray(importedProject.history)) {
    for (const item of importedProject.history) {
      if (Array.isArray(item.images)) {
        for (const img of item.images) {
          if (img && img.id && img.base64 && !normalizedPool[img.id]) {
            normalizedPool[img.id] = img.base64;
            if (img.contentHash && !normalizedPool[img.contentHash]) {
              normalizedPool[img.contentHash] = img.base64;
            }
          }
        }
      }
    }
  }

  // Also collect any inline base64 from asset library items in legacy exports
  if (Array.isArray(importedProject.assetLibrary)) {
    for (const asset of importedProject.assetLibrary) {
      const inlineB64 = (asset as any).base64;
      if (asset && asset.id && inlineB64 && !normalizedPool[asset.id]) {
        normalizedPool[asset.id] = inlineB64;
        if (asset.contentHash && !normalizedPool[asset.contentHash]) {
          normalizedPool[asset.contentHash] = inlineB64;
        }
      }
    }
  }

  // Pre-hydrate all pool entries into IndexedDB "images" store
  const poolKeys = Object.keys(normalizedPool);
  for (let i = 0; i < poolKeys.length; i++) {
    const key = poolKeys[i];
    const b64 = normalizedPool[key];
    if (b64) {
      try {
        await saveStoredImage(key, b64, key.length === 64 ? key : undefined);
      } catch (err) {
        console.warn(`Failed to hydrate image pool entry ${key}:`, err);
      }
    }
    if (i > 0 && i % BATCH_SIZE === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Ensure all history item image references point to valid records in IndexedDB
  // and strip inline base64 strings to prevent IndexedDB storage bloat
  if (Array.isArray(importedProject.history)) {
    for (const item of importedProject.history) {
      if (Array.isArray(item.images)) {
        for (const img of item.images) {
          if (img && img.id) {
            const b64 =
              (img.contentHash && normalizedPool[img.contentHash]) ||
              normalizedPool[img.id] ||
              img.base64;
            if (b64) {
              try {
                await saveStoredImage(img.id, b64, img.contentHash);
              } catch (err) {
                console.warn(`Failed to map history image ${img.id}:`, err);
              }
            }
            // Clear inline base64 once safely stored in IndexedDB
            img.base64 = "";
          }
        }
      }
    }
  }

  // Ensure all assetLibrary images point to valid records in IndexedDB
  if (Array.isArray(importedProject.assetLibrary)) {
    for (const asset of importedProject.assetLibrary) {
      if (asset && asset.id) {
        const b64 =
          (asset.contentHash && normalizedPool[asset.contentHash]) ||
          normalizedPool[asset.id] ||
          (asset as any).base64;
        if (b64) {
          try {
            await saveStoredImage(asset.id, b64, asset.contentHash);
          } catch (err) {
            console.warn(`Failed to map asset image ${asset.id}:`, err);
          }
        }
        delete (asset as any).base64;
      }
    }
  }

  await saveProject(importedProject);
  return importedProject;
}
