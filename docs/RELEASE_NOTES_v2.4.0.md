## v2.4.0: Import. Inspect. Enforce.

**PromptLab v2.4.0** introduces a fully redesigned **preset import experience** with configurable Duplicate vs. Replace strategies, a rich summary inspector, and a unified pipeline that routes both URL and local JSON file imports through the same workflow. On the deployment side, the new **`ALLOW_SERVER_ENV_KEY`** environment flag gives operators fine-grained control over server-side API key usage, while a shared `getActiveApiKey()` helper centralizes key resolution across all Files API upload actions. This release also extracts the URL import logic and import confirmation modal into dedicated reusable modules.

---

### ✨ Highlights

#### 🔄 Preset Import — Strategy, Inspector & Unified Pipeline

When importing presets from a URL query parameter or a local JSON file, you now get full control over how duplicates are handled, a detailed breakdown of what will be imported, and a visual inspector to review each item before committing.

- 🔀 **Duplicate vs. Replace Strategy Selector** — the redesigned `PresetImportConfirmModal` presents a segmented toggle letting you choose between **Create Duplicate** (safe default — assigns a fresh ID and auto-increments the name with a numeric suffix like `"My Preset (2)"` on ID or name conflicts) and **Replace Existing** (overwrites the matching preset by its ID with the incoming content). Switching the strategy live re-evaluates the import result without re-uploading.
- 📊 **Four-Column Summary Grid** — the modal displays a rich metadata box (preset name, source URL/file) and a Detected / New / Replaced / Skipped counts breakdown, giving you an at-a-glance audit of what the import will do.
- 🔍 **Expandable Item Inspector** — an expandable, scrollable list shows every individual preset item with action badges (`NEW`, `REPLACE`, `SKIPPED`). Skipped items reveal their reason (exact ID match or identical name+content match with a different ID), so nothing is silently dropped.
- ✅ **Workspace Application Checkbox** — optionally apply the imported preset directly to the active workspace ("Apply as Active Workspace Prompt") in one click.
- 🌐 **Unified URL & Local File Import Pipeline** — the "Import JSON" action in the Configure Prompts modal now routes through the same `openJsonPresetImport()` pipeline as URL imports. Both flows share the `PresetImportConfirmModal` and `useUrlPresetImport` hook, giving local file imports the strategy selector, summary grid, and item inspector.
- 🔗 **`preseturl` Query Parameter** — the URL preset import detector now also recognizes `?preseturl=` (case-insensitive) alongside the existing `presetUrl`, `configUrl`, `preset`, and `config` parameters.

#### 🔐 ALLOW_SERVER_ENV_KEY — Enforce User-Supplied API Keys

A new deployment-level configuration flag lets you disable the server-side `GEMINI_API_KEY`, requiring every end-user to supply their own custom API key in Engine Controls — perfect for public or shared deployments where you don't want to expose shared API quotas.

- 🚦 **Gate the Server Key** — set `ALLOW_SERVER_ENV_KEY="false"` to block all generation and file upload requests that don't include a user-supplied custom API key. The default is `"true"` (backwards-compatible — existing deployments continue working without changes).
- 🧾 **Differentiated Error Messages** — users see a specific "Server environment API key usage is disabled on this deployment. Please enter your custom Gemini API key in 'Engine Controls'" message instead of a generic "No Gemini API key found" error, providing clear, actionable guidance.
- ⚡ **Per-Request Dynamic Client Instantiation** — the generation handler (`app/api/generate/route.ts`) no longer uses a static module-level `GoogleGenAI` singleton. Instead, it creates a dynamic client instance on every request based on the resolved active API key (custom key first, then server env key if permitted), ensuring the correct key and user-agent are always used.
- 🔧 **Centralized `getActiveApiKey()` Helper** — the Files API upload handler (`app/api/upload-file/route.ts`) extracts a shared helper function that centralizes key resolution logic across all upload actions: direct resumable, chunked proxy, list, delete, and single-file upload. Every action path now gets consistent key enforcement with proper differentiated error responses.

---

### ✨ What's New

- 🔀 **Configurable import strategy** — choose Duplicate (safe, auto-incrementing names) or Replace (in-place overwrite by ID) for preset imports
- 📊 **Redesigned PresetImportConfirmModal** — four-column summary grid, expandable item inspector with per-item action badges, and skip-reason explanations
- 🌐 **Unified URL + local JSON import pipeline** — both routes share the same strategy selector and inspector via `openJsonPresetImport()`
- 🔗 **`preseturl` query parameter** — fifth recognized URL param for remote preset imports
- 📋 **Skip-reason differentiation** — `exact_match` (identical ID) vs. `content_match_different_id` (same name+content, different ID) in import results
- 🚦 **ALLOW_SERVER_ENV_KEY flag** — disable the server-side API key to enforce user-supplied keys on deployments
- 🧾 **Differentiated API key error messages** — specific "Server environment API key usage is disabled" guidance vs. generic fallback
- ⚡ **Per-request dynamic GoogleGenAI client** — replaces static module-level singleton in generation handler
- 🔧 **`getActiveApiKey()` shared helper** — centralized key resolution across all Files API upload actions
- 📦 **`PresetImportConfirmModal` component** — extracted import confirmation UI into a standalone, reusable component
- 🪝 **`useUrlPresetImport` custom hook** — ~400+ lines of URL import state management extracted from `app/page.tsx`
- 🔄 **Enhanced `importPresetsFromJSON()`** — supports `importStrategy` option, returns `replacedCount` and `processedItems`, accepts `{ preset: ... }` single-wrapper JSON objects

---

### 🏗 Architecture & Refactoring

- 📦 **Extracted `PresetImportConfirmModal` component** — the import confirmation UI (preset metadata card, strategy selector, summary grid, expandable item list, workspace-application checkbox, loading spinner, error toast, and success toast) was split into its own component at `components/PresetImportConfirmModal.tsx` with a clean `PresetImportConfirmModalProps` interface.
- 🪝 **Extracted `useUrlPresetImport` custom hook** — ~400+ lines of state management, URL query parameter detection, remote fetch, preset parsing, duplicate evaluation, workspace application, and localStorage persistence were moved from `app/page.tsx` into `hooks/use-url-preset-import.ts`. The hook exposes `openJsonPresetImport()` for triggering the same import workflow from local file uploads and an `onSetImportStrategy` callback for live strategy switching.
- 🧩 **Enhanced `importPresetsFromJSON()` in `lib/preset-export.ts`** — the core import utility now supports a configurable `importStrategy` option (Duplicate vs. Replace), returns `replacedCount` alongside `importedCount` and `skippedCount`, generates unique preset names via auto-incrementing suffixes, and accepts `{ preset: ... }` single-wrapper JSON objects as a valid import source format.
- 🔧 **Centralized `getActiveApiKey()` in `app/api/upload-file/route.ts`** — shared helper function extracts `ALLOW_SERVER_ENV_KEY` logic and key resolution from every upload, list, and delete action path, eliminating duplicated code and ensuring consistent error messaging across all Files API operations.