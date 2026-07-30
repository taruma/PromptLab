import { computeContentHash } from "./content-hash";

// --- IndexedDB Configuration & Helper functions ---
export const DB_NAME = "promptlab_db";
export const DB_VERSION = 3;
export const STORE_NAME = "images";
export const STORE_PROJECTS = "projects";

export interface StoredImageRecord {
  id: string;
  base64?: string;
  contentHash?: string;
  dedupRefId?: string;
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      let imageStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        imageStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      } else {
        imageStore = request.transaction!.objectStore(STORE_NAME);
      }
      if (!imageStore.indexNames.contains("contentHash")) {
        imageStore.createIndex("contentHash", "contentHash", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
      }
    };
  });
}

/**
 * Retrieve raw record from "images" store without following dedup references
 */
export function getStoredImageRecord(id: string): Promise<StoredImageRecord | null> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve((request.result as StoredImageRecord) || null);
      };
    });
  });
}

/**
 * Get base64 data for an image by ID.
 * Transparently resolves dedupRefId if record points to a master image record.
 */
export function getStoredImage(id: string, visited = new Set<string>()): Promise<string | null> {
  if (!id || visited.has(id)) return Promise.resolve(null);
  visited.add(id);

  return getStoredImageRecord(id).then((record) => {
    if (!record) return null;
    if (record.base64 && record.base64.trim().length > 0) {
      return record.base64;
    }
    if (record.dedupRefId) {
      return getStoredImage(record.dedupRefId, visited);
    }
    return null;
  });
}

/**
 * Save an image to IndexedDB with automatic content-hash deduplication.
 * Keeps unique image ID records while avoiding storing redundant base64 strings.
 */
export async function saveStoredImage(id: string, base64: string, contentHash?: string): Promise<void> {
  if (!id || !base64) return;

  const hash = contentHash || (await computeContentHash(base64));
  const cleanPayload = base64.includes(",") ? base64.split(",")[1] : base64;

  const db = await openDB();

  // Step 1: Query for candidate records with matching contentHash
  let foundMasterId: string | null = null;

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    let request: IDBRequest;
    if (hash && store.indexNames.contains("contentHash")) {
      const index = store.index("contentHash");
      request = index.getAll(hash);
    } else {
      request = store.getAll();
    }

    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      const candidates: StoredImageRecord[] = request.result || [];
      for (const candidate of candidates) {
        if (candidate.id === id) continue;

        let candidateB64: string | null = candidate.base64 || null;
        if (!candidateB64 && candidate.dedupRefId) {
          try {
            candidateB64 = await getStoredImage(candidate.dedupRefId);
          } catch {
            candidateB64 = null;
          }
        }

        if (candidateB64) {
          const candidateClean = candidateB64.includes(",") ? candidateB64.split(",")[1] : candidateB64;
          if (candidateClean === cleanPayload) {
            foundMasterId = candidate.dedupRefId || candidate.id;
            break;
          }
        }
      }
      resolve();
    };
  });

  // Step 2: Save record in readwrite transaction
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const recordToSave: StoredImageRecord = { id, contentHash: hash };

    if (foundMasterId && foundMasterId !== id) {
      recordToSave.dedupRefId = foundMasterId;
    } else {
      recordToSave.base64 = base64;
    }

    const putReq = store.put(recordToSave);
    putReq.onerror = () => reject(putReq.error);
    putReq.onsuccess = () => resolve();
  });
}

/**
 * Check if an image ID is currently referenced in any project's assetLibrary
 * or history items across IndexedDB "projects" store and current localStorage.
 */
export async function isImageReferencedInAnyProject(imageId: string): Promise<boolean> {
  if (!imageId || typeof window === "undefined" || !window.indexedDB) return false;

  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_PROJECTS)) return false;

    // 1. Scan all projects in IndexedDB "projects" store
    const projects: any[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, "readonly");
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });

    for (const proj of projects) {
      // Check asset library
      if (Array.isArray(proj.assetLibrary)) {
        if (proj.assetLibrary.some((asset: any) => asset.id === imageId)) {
          return true;
        }
      }
      // Check history items
      if (Array.isArray(proj.history)) {
        for (const item of proj.history) {
          if (Array.isArray(item.uploadedImages)) {
            if (
              item.uploadedImages.some(
                (img: any) => img.id === imageId || img.libraryImgId === imageId
              )
            ) {
              return true;
            }
          }
        }
      }
    }

    // 2. Check active session state in localStorage as a fallback
    try {
      const activeLib = localStorage.getItem("prompt_generator_library_images");
      if (activeLib) {
        const parsed = JSON.parse(activeLib);
        if (Array.isArray(parsed) && parsed.some((asset: any) => asset.id === imageId)) {
          return true;
        }
      }

      const activeHist = localStorage.getItem("prompt_generator_history");
      if (activeHist) {
        const parsed = JSON.parse(activeHist);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (Array.isArray(item.uploadedImages)) {
              if (
                item.uploadedImages.some(
                  (img: any) => img.id === imageId || img.libraryImgId === imageId
                )
              ) {
                return true;
              }
            }
          }
        }
      }
    } catch (_) {}

    return false;
  } catch (err) {
    console.warn("Failed to check project image references:", err);
    // If check fails, assume referenced to prevent premature data loss
    return true;
  }
}

/**
 * Safely delete an image record from IndexedDB.
 * Checks if the image is still referenced by any other project or history item before deleting.
 * If this record is a master image holding base64 data and other records depend on it,
 * promotes the first dependent record to master before deleting this record.
 */
export async function deleteStoredImage(id: string, forceDelete = false): Promise<void> {
  if (!id) return;

  // Protect shared assets across projects: Skip actual DB deletion if still in use
  if (!forceDelete) {
    const isReferenced = await isImageReferencedInAnyProject(id);
    if (isReferenced) {
      console.info(
        `[PromptLab IndexedDB] Image ${id} is still referenced by another project workspace or history item. Preserving binary payload in database.`
      );
      return;
    }
  }

  const db = await openDB();

  const record = await getStoredImageRecord(id);
  if (!record) return;

  // Find records depending on this ID
  const dependents: StoredImageRecord[] = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const all: StoredImageRecord[] = request.result || [];
      resolve(all.filter((item) => item.dedupRefId === id));
    };
  });

  if (dependents.length > 0) {
    if (record.base64 && record.base64.trim().length > 0) {
      // Promote first dependent to new master
      const newMaster = dependents[0];
      const newMasterRecord: StoredImageRecord = {
        id: newMaster.id,
        base64: record.base64,
        contentHash: newMaster.contentHash || record.contentHash,
      };

      const remainingDependents = dependents.slice(1).map((dep) => ({
        ...dep,
        dedupRefId: newMaster.id,
      }));

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.put(newMasterRecord);
        for (const dep of remainingDependents) {
          store.put(dep);
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } else if (record.dedupRefId) {
      // Point dependents directly to the target master
      const targetMasterId = record.dedupRefId;
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        for (const dep of dependents) {
          store.put({ ...dep, dedupRefId: targetMasterId });
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Migration & Deduplication helper:
 * Scans all IndexedDB "images" records, backfills missing contentHashes,
 * and consolidates duplicate base64 image strings into dedupRefId pointers.
 */
export async function deduplicateStoredImages(): Promise<{
  scannedCount: number;
  dedupCount: number;
  hashesAssigned: number;
}> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return { scannedCount: 0, dedupCount: 0, hashesAssigned: 0 };
  }

  const db = await openDB();

  const allRecords: StoredImageRecord[] = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });

  if (!allRecords || allRecords.length === 0) {
    return { scannedCount: 0, dedupCount: 0, hashesAssigned: 0 };
  }

  let hashesAssigned = 0;
  let dedupCount = 0;

  const resolvedRecords: {
    record: StoredImageRecord;
    hash: string;
    cleanPayload: string;
  }[] = [];

  for (const record of allRecords) {
    let b64 = record.base64;
    if (!b64 && record.dedupRefId) {
      try {
        b64 = (await getStoredImage(record.dedupRefId)) || undefined;
      } catch {
        b64 = undefined;
      }
    }

    let hash = record.contentHash;
    if (!hash && b64) {
      hash = await computeContentHash(b64);
      hashesAssigned++;
    }

    const cleanPayload = b64 ? (b64.includes(",") ? b64.split(",")[1] : b64) : "";

    resolvedRecords.push({
      record: { ...record, contentHash: hash || record.contentHash },
      hash: hash || "",
      cleanPayload,
    });
  }

  const groups = new Map<string, typeof resolvedRecords>();

  for (const item of resolvedRecords) {
    if (!item.hash || !item.cleanPayload) continue;
    const groupKey = `${item.hash}_${item.cleanPayload.length}_${item.cleanPayload.slice(0, 32)}`;
    const existing = groups.get(groupKey) || [];
    existing.push(item);
    groups.set(groupKey, existing);
  }

  const updatesToApply: StoredImageRecord[] = [];

  for (const [, items] of groups) {
    if (items.length <= 1) continue;

    const masterIndex = items.findIndex((i) => Boolean(i.record.base64 && i.record.base64.length > 0));
    const masterItem = masterIndex >= 0 ? items[masterIndex] : items[0];
    const masterId = masterItem.record.id;

    if (!masterItem.record.base64 && masterItem.cleanPayload) {
      const fullB64 = masterItem.record.base64 || (await getStoredImage(masterId)) || undefined;
      if (fullB64) {
        updatesToApply.push({
          id: masterId,
          base64: fullB64,
          contentHash: masterItem.hash,
        });
      }
    }

    for (const item of items) {
      if (item.record.id === masterId) continue;

      if (item.record.base64 || item.record.dedupRefId !== masterId) {
        updatesToApply.push({
          id: item.record.id,
          contentHash: item.hash,
          dedupRefId: masterId,
        });
        dedupCount++;
      }
    }
  }

  if (updatesToApply.length > 0 || hashesAssigned > 0) {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      for (const record of updatesToApply) {
        store.put(record);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    console.info(
      `[PromptLab IndexedDB] Migration & Deduplication complete: ${dedupCount} duplicate payload(s) consolidated, ${hashesAssigned} contentHash(es) backfilled.`
    );
  }

  return { scannedCount: allRecords.length, dedupCount, hashesAssigned };
}

