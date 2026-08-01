import { HistoryItem } from "./history-export";
import { getProject, saveProject, getCurrentProjectId } from "./projects";

/**
 * Remove legacy heavy history payload from localStorage once safely persisted in IndexedDB.
 */
export function saveHistoryToLocalStorage(_history: HistoryItem[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    // Remove heavy history from localStorage as history is now stored in IndexedDB.
    localStorage.removeItem("prompt_generator_history");
    localStorage.removeItem("prompt_generator_history_v1");
  } catch (err: any) {
    console.warn("Error cleaning legacy history key from localStorage:", err);
  }
}

/**
 * Load history items for the active workspace.
 * Reads from the active project in IndexedDB.
 * If IndexedDB project history is empty, falls back to legacy localStorage,
 * migrates the items into the IndexedDB project, and then cleans localStorage.
 */
export async function loadHistoryFromStorage(): Promise<HistoryItem[]> {
  if (typeof window === "undefined") return [];

  const currentProjectId = getCurrentProjectId();
  let dbHistory: HistoryItem[] | null = null;

  if (currentProjectId) {
    try {
      const project = await getProject(currentProjectId);
      if (project && Array.isArray(project.history) && project.history.length > 0) {
        dbHistory = project.history;
      }
    } catch (err) {
      console.warn("Failed to load history from IndexedDB active project:", err);
    }
  }

  if (dbHistory && dbHistory.length > 0) {
    // Safely clean legacy heavy key from localStorage to free up origin quota
    saveHistoryToLocalStorage(dbHistory);
    return dbHistory;
  }

  // Fallback to localStorage if IndexedDB project history was empty
  let lsHistory: HistoryItem[] = [];
  try {
    const raw =
      localStorage.getItem("prompt_generator_history_v1") ||
      localStorage.getItem("prompt_generator_history");
    if (raw) {
      lsHistory = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to parse localStorage history fallback:", err);
  }

  // If items were retrieved from localStorage, migrate them to the active IndexedDB project
  if (lsHistory.length > 0 && currentProjectId) {
    try {
      const project = await getProject(currentProjectId);
      if (project) {
        const updatedProject = {
          ...project,
          history: lsHistory,
          updatedAt: new Date().toISOString(),
        };
        await saveProject(updatedProject);
        // Clean legacy key from localStorage after successful migration
        saveHistoryToLocalStorage(lsHistory);
      }
    } catch (err) {
      console.warn("Failed to migrate localStorage history into IndexedDB project:", err);
    }
  }

  return lsHistory;
}
