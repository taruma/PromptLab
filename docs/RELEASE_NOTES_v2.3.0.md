## v2.3.0: Upload. Measure. Persist.

**PromptLab v2.3.0** integrates **direct Gemini Files API integration** for uploading media up to 2 GB with two upload paths and a built-in file browser, a comprehensive **token usage and cost estimation system** with real-time per-model pricing badges, and smarter **preset state persistence** that survives page refreshes. This release also delivers intelligent processing state polling, automated Base64 fallback when Files API assets expire, and hardened error handling across the entire upload and generation pipeline.

---

### ✨ Highlights

#### 📤 Gemini Files API — Direct Uploads & Smart Browser

Upload images and videos up to 2 GB directly to Google's Gemini Files API via two upload paths — a high-speed direct resumable stream and a reliable chunked proxy — plus a "Select Existing" file browser for reusing previously uploaded assets without re-uploading.

- ⚡ **High-Speed Direct Resumable Upload** (`handleDirectResumableUpload` in `AddFilesApiModal.tsx`) — requests a resumable upload session header (`X-Goog-Upload-URL`) from a new `action: "resumable_session"` backend endpoint and streams binary file bytes directly from the browser to Google Cloud via `XMLHttpRequest` with real-time percentage progress tracking (30%–95%), completely bypassing Vercel's 4.5 MB request body limit and execution timeouts for large media files up to 2 GB
- 🔁 **Smart CORS Verification** — if browser CORS policies block reading the raw completion response, a background `action: "list"` call automatically checks Gemini Files API storage to confirm file creation without raising CORS error popups or duplicating uploads. If direct upload is blocked entirely, the system seamlessly falls back to the chunked proxy pipeline
- 📦 **Chunked Proxy Upload** — splits large files into 2 MB chunks uploaded sequentially with a session `uploadId`, staged in system temp storage (`start`, `chunk`, `finish`, `cancel` actions), then reassembled and streamed to Gemini Files API via `@google/genai`
- 🔍 **"Select Existing" Tab** — browse, search, and attach previously uploaded files stored on Google's Gemini Files API without re-uploading. The backend route supports `action: "list"` and `action: "delete"` commands using `ai.files.list()` and `ai.files.delete()`. Each file card displays filename, size, MIME type badge, `ACTIVE`/`PROCESSING` status, 48-hour expiration countdown, `fileUri` with a quick copy button, custom reference label input, and an instant "Delete" button with an in-modal confirmation banner (replacing native `confirm()` dialogs frequently blocked in iframe environments)
- 🔄 **Processing State Polling** — both server-side and client-side automatically poll media files stuck in `PROCESSING` state until they reach `ACTIVE`. The generation route polls `ai.files.get()` up to 15 times at 2-second intervals per image/video reference before invoking generation. The upload modal polls up to 8 times post-upload (direct path) and up to 10 verify + 8 processing iterations (CORS verification path), showing "Processing media tracks on Google Cloud..." status feedback. Errors now differentiate between PROCESSING ("wait a few seconds and try again"), FAILED ("re-upload or select a different asset"), and expired/inaccessible states ("48-hour expiry or API key mismatch") with specific resolution guidance for each
- 🛡️ **Pre-Verification & Automatic Base64 Fallback** — the generation pipeline pre-verifies every `fileUri` resource with `ai.files.get()` before invoking `generateContentStream()`. Inaccessible Files API assets (48-hour expiration, API key mismatch, or `FAILED` state) automatically fall back to inline Base64 data if available in the workspace asset payload. When fallback is impossible, it reports a clear asset-specific error identifying the exact `@imageN`/`@videoN` tag and resource ID with step-by-step resolution instructions
- 🏷️ **FILES API Badge & History** — all Files API assets display an emerald-green `FILES API` badge on their asset cards (`VisualAssetCard` and `VideoAssetCard`) with local blob URL preview playback. References persist in `HistoryItem` objects with `isFilesApi`, `fileUri`, and `expirationTime` metadata, allowing historical generations to recall and re-run using active Files API URIs within their 48-hour lifecycle

#### 💰 Token Usage Tracking & Cost Estimation

A comprehensive token tracking and cost estimation system gives you real-time visibility into generation costs, with per-model pricing badges in the engine controls and persistent cost data in your history.

- 📊 **Real-Time Token Display** — the output panel header shows `TOKENS: {total} ({prompt} IN [{cached} CACHED] / {candidates} OUT)`, updated live as the server broadcasts `usageMetadata` (prompt, candidates, total, and cached content token counts) via SSE `usage` events
- 💵 **Estimated Cost Badge** — an emerald-green cost badge appears alongside the character count, computed by `calculateEstimatedCost(selectedModel, tokenUsage)` from the new `lib/pricing.ts` module. Costs display in USD (`$0.001234` or `< $0.000001` for sub-micro amounts)
- 🗂️ **6-Model Pricing Table** — `lib/pricing.ts` covers Gemini 3.6 Flash, 3.5 Flash, 3.5 Flash-Lite, 3.1 Pro Preview (tiered ≤200K / >200K), 3.1 Flash-Lite, and 3 Flash Preview, with audio input rate support and model alias resolution via `MODEL_ALIASES`
- 🎛️ **Pricing Rate Badges in Engine Controls** — each model selection card in `EngineControlsModal` now displays per-model `IN: $X.XX / 1M` / `OUT: $X.XX / 1M` pricing rates in its footer, sourced from `getModelPricingSummary()`. Tiered pricing models display a range (e.g. `$2.00–$4.00 / 1M`)
- 💾 **Persistent Cost History** — `tokenUsage` and `estimatedCost` are stored in `HistoryItem` objects at generation time via `calculateEstimatedCost()` and preserved across history JSON import/export. Cost display in `HistoryCardSummary` and `HistoryViewerModal` prefers the stored `estimatedCost` field over recomputation, keeping your historical cost data stable even if pricing rates change in the future
- 🔁 **Session-Surviving Token State** — active `tokenUsage` persists to `localStorage` under `prompt_generator_token_usage` so your token counts survive page refreshes alongside other session state, restoring automatically on mount

#### 💾 Preset Persistence & Error Hardening

- 📌 **Preset Selection Persistence** — the active `loadedPresetId` is now persisted to `localStorage` under `prompt_generator_loaded_preset_id` and restored on application load. The loaded preset selection stays visible even when editor content diverges, with an amber `[EDIT]` badge on the preset list item indicating modified content alongside a `[Deselect]` option to clear the association
- 🚫 **413 Prevention** — the chunked proxy upload pipeline completely eliminates HTTP 413 "Request Entity Too Large" errors for files up to 2 GB
- 🧹 **SSE Error Unwrapping** — both server-side and client-side now properly unwrap stringified nested JSON error objects from the GoogleGenAI SDK into clean, human-readable text. `403 PERMISSION_DENIED` errors on expired Files API assets now provide clear actionable guidance explaining 48-hour expiry and API key binding
- 🖼️ **Empty `src` Sanitization** — six components (`VisualAssetCard`, `VideoAssetCard`, `AssetLibrarySidebar`, `AssetImportModal`, `HistoryViewerModal`, `VideoPlayerModal`) now rigorously sanitize image and video sources, rendering clean fallback placeholder UI instead of passing empty string `""` values to `<img>`, `<video>`, or `<iframe>` `src` attributes, eliminating browser console warnings and unwanted network requests

---

### ✨ What's New

- 📤 **Gemini Files API integration** — upload images/videos up to 2 GB via direct resumable upload or 2 MB chunked proxy
- ⚡ **High-speed direct resumable upload** — streams bytes directly to Google Cloud via XHR, bypassing Vercel's 4.5 MB limit
- 🔁 **Smart CORS verification** — background file listing confirms upload completion without error popups
- 🔍 **"Select Existing" file browser** — browse, search, and attach previously uploaded Files API assets
- 🔄 **Processing state polling** — server-side (15× at 2s) and client-side (8-18×) polling until files reach `ACTIVE`
- 🛡️ **Pre-verification with Base64 fallback** — auto-fallback when Files API assets expire or are inaccessible
- 🏷️ **FILES API badge** on asset cards with local blob URL preview playback
- 💰 **Token usage tracking** — real-time token counts (prompt/candidates/cached/total) via SSE events
- 💵 **Estimated cost badge** — live USD cost computed per-model from `lib/pricing.ts` with 6 models covered
- 🎛️ **Pricing rate badges** in Engine Controls model selector cards
- 💾 **Cost history persistence** — `tokenUsage` + stable `estimatedCost` stored in `HistoryItem` objects
- 📌 **Preset selection persistence** — `loadedPresetId` survives page refreshes; `[EDIT]` badge on modified presets
- 🚫 **413 "Request Entity Too Large" prevention** in Files API uploader
- 🧹 **SSE error unwrapping** — `403 PERMISSION_DENIED` on expired Files API assets now shows clear guidance
- 🖼️ **Empty `src` sanitization** — six components prevent empty `src` attributes on media elements

---

### 🐛 Fixed

- **Files API Pre-Verification & Automatic Base64 Fallback** — inaccessible `fileUri` resources automatically fall back to inline Base64 data if available; clear asset-specific errors when fallback isn't possible
- **Gemini Stream Error Formatting & 403 Permission Error Handling** — SSE stream errors like `403 PERMISSION_DENIED` on expired Files API file references are no longer swallowed internally; server and client both unwrap stringified nested JSON error objects with actionable guidance explaining 48-hour expiry and API key binding
- **In-Modal Deletion Confirmation for Gemini Files API Resources** — native browser `confirm()`/`alert()` dialogs replaced with inline in-modal confirmation banner that works reliably inside preview iframe environments
- **Empty String `src` Attribute Prevention for Media Elements** — six image/video components rigorously sanitize sources to prevent empty `""` values on `<img>`, `<video>`, `<iframe>` tags, eliminating browser console warnings and unwanted network requests for Files API assets without inline Base64 streams
- **Base64 Decoding Error on Files API Media References** — server-side generation proxy now correctly checks `fileUri` and `isFilesApi` flags to construct proper `fileData` parts instead of attempting to parse temporary client-side `blob:` preview URLs as Base64 data
- **413 Request Entity Too Large Prevention for Large File Uploads** — 2 MB chunked pipeline with session `uploadId` and `start`/`chunk`/`finish`/`cancel` actions eliminates HTTP 413 errors for uploads up to 2 GB
- **Preset Edit Indicator and Selection Preservation** — loaded preset selection now persists even when editor content diverges, with an amber `[EDIT]` badge and `[Deselect]` option; `loadedPresetId` persisted to `localStorage` for cross-refresh continuity
