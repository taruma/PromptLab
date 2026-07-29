## v2.4.0: Import. Inspect. Enforce.

**PromptLab v2.4.0** delivers the biggest preset expansion yet — **10 specialized folder-based presets** replace the original 3 flat JSON presets, each with its own `system_prompt.txt` and `prompt_template.txt`. This release also introduces a fully redesigned **preset import experience** with configurable Duplicate vs. Replace strategies, a rich summary inspector, and a unified pipeline for URL and local file imports. On the UI side, **simplified color-coded header buttons**, a **Ko-fi support link**, **mobile-responsive layout refinements**, and a **Quick Preset Selector row redesign** with system prompt excerpt previews make the workspace more intuitive. For deployments, the new **`ALLOW_SERVER_ENV_KEY`** flag gives operators fine-grained control over server-side API key usage.

---

### ✨ Highlights

#### 🎬 10 New Folder-Based Presets

Replaced the 3 original flat JSON presets (AI Casting & Screenplay, AI Director & Storyboard, VFX & Speculative Worldbuilder) with 10 new specialized folder-based presets, each storing `meta.json`, `system_prompt.txt`, and `prompt_template.txt` as individual files. The per-preset architecture means each preset defines its own output formatting rules (plain text, Markdown, JSON, etc.) rather than relying on a global `system_prompt.txt` (which was emptied in this release):

- **Cine DeepDive** — Cinematic Language Educator for multi-dimensional scene analysis across all cinematic layers (shot design, composition, camera movement, lighting, color, lenses, editing, sound) with AI generation toolkit and creative re-imagining.
- **Color Mapper** — Color Language Specialist for extracting, naming, and designing color palettes with grading style identification, color psychology notes, and AI generation color tokens.
- **Comp Decoder** — Visual Composition Analyst for reverse-engineering images into compositional building blocks (geometry, weight distribution, depth layers, line dynamics) with AI prompt composition tokens.
- **Film Lingo** — Cinematic Language Translator for converting concepts into rich cinematic language with ready-to-use AI generation prompts.
- **Genre Lexicon** — Genre & Tone Lexicon for defining and articulating genre conventions, tonal registers, and their visual signatures.
- **Motion Lab** — Camera Motion Specialist for naming and analyzing camera movements (dolly, handheld, Steadicam, crane, zoom) with emotional motivation, movement arc analysis, and AI video motion tokens.
- **Scene Lab** — Scene Construction Coach for turning character interactions into fully visualized scene descriptions with camera, lighting, and blocking choices expressing emotional subtext.
- **Shot Interp** — Shot Language Interpreter for reverse-engineering finished scenes into professional shot-by-shot breakdowns with narrative purpose and directing insights.
- **Style Architect** — Visual Identity Architect for defining comprehensive visual style guides with color philosophy, composition doctrine, lighting signature, AI style bibles, and creative director's notes.
- **Vis Narrative** — Visual Narrative Architect for crafting director's treatment blueprints, tonal maps, and AI generation prompt suites.

#### 🔄 Preset Import — Strategy, Inspector & Unified Pipeline

When importing presets from a URL query parameter or a local JSON file, you now get full control over how duplicates are handled, a detailed breakdown of what will be imported, and a visual inspector to review each item before committing.

- 🔀 **Duplicate vs. Replace Strategy Selector** — the redesigned `PresetImportConfirmModal` presents a segmented toggle letting you choose between **Create Duplicate** (safe default — assigns a fresh ID and auto-increments the name with a numeric suffix like `"My Preset (2)"` on ID or name conflicts) and **Replace Existing** (overwrites the matching preset by its ID with the incoming content). Switching the strategy live re-evaluates the import result without re-uploading.
- 📊 **Four-Column Summary Grid** — the modal displays a rich metadata box (preset name, source URL/file) and a Detected / New / Replaced / Skipped counts breakdown, giving you an at-a-glance audit of what the import will do.
- 🔍 **Expandable Item Inspector** — an expandable, scrollable list shows every individual preset item with action badges (`NEW`, `REPLACE`, `SKIPPED`). Skipped items reveal their reason (exact ID match or identical name+content match with a different ID), so nothing is silently dropped.
- ✅ **Workspace Application Checkbox** — optionally apply the imported preset directly to the active workspace ("Apply as Active Workspace Prompt") in one click.
- 🌐 **Unified URL & Local File Import Pipeline** — the "Import JSON" action in the Configure Prompts modal now routes through the same `openJsonPresetImport()` pipeline as URL imports. Both flows share the `PresetImportConfirmModal` and `useUrlPresetImport` hook, giving local file imports the strategy selector, summary grid, and item inspector.
- 🔗 **`preseturl` Query Parameter** — the URL preset import detector now also recognizes `?preseturl=` (case-insensitive) alongside the existing `presetUrl`, `configUrl`, `preset`, and `config` parameters.

#### 🛡️ Preset Workspace Safety — Replace Confirmation & State Persistence

- 🚨 **Preset Replace Confirmation Modal** (`PresetReplaceConfirmModal`) — switching presets via the Quick Preset Selector when the active workspace contains unsaved prompt edits now triggers a dedicated confirmation dialog. Choose "Keep My Edits" (cancel switch) or "Replace Prompts" (confirm overwriting active system instructions and prompt template) to prevent accidental data loss.
- 💾 **Active preset state persistence across page refresh** — `loadedPresetId` is now persisted in `localStorage` (`prompt_generator_loaded_preset_id`), so refreshing the browser retains the active preset connection and its `[EDIT]` badge status instead of resetting to "Custom Workspace."
- 📸 **Snapshot-based discard in Configure Prompts modal** — opening the prompt configuration editor now captures an initial snapshot of the active preset state, ensuring that clicking "Cancel" and confirming discard accurately restores `loadedPresetId`, `activeEditingPresetId`, and `newPresetName` to their exact snapshot values.

#### 🖌️ UI Refinements — Header, Quick Preset Selector & Mobile Layout

- 💙 **Ko-fi Support Button** — a standalone `KofiButton` component styled with Ko-fi's signature soft blue background (`#72a4f2`) sits in the top navigation bar. Toggleable via the `NEXT_PUBLIC_ENABLE_KOFI_BUTTON` environment variable.
- 🏷️ **Simplified Header Navigation Buttons** — top header actions streamlined to single-word labels with distinct pastel color accents for glanceability: **Assets** (Teal), **Engine** (Indigo), **Prompts** (Amber), and **Clear** (Rose with `RotateCcw` icon). Labels are hidden on mobile for compact icon-only buttons.
- 📱 **Mobile Header & Visual Assets Responsive Layout** — the header splits into two rows on mobile: Row 1 with branding and Project Manager button (Quick Preset Selector hidden), Row 2 with icon-only action buttons stretching evenly. Visual Assets section header restored to a clean single-row desktop layout with title, action buttons, and the `{{ visual_references }}` tag.
- 📝 **Quick Preset Selector Row Redesign** — each preset row now shows a **2-line system prompt excerpt preview** beneath the preset name, giving users a quick understanding of what each preset does without opening the Configure Prompts modal. The "Manage All Presets & Prompts" footer button was removed for a cleaner dropdown experience.
- 📖 **Updated Lab Manual** — refreshed onboarding guide reflecting current header control names, Files API uploads (up to 2 GB), preset URL sharing, and a quick tips bar highlighting Multi-Project Workspaces, Reasoning Effort levels, and History Archives.

#### 🔐 ALLOW_SERVER_ENV_KEY — Enforce User-Supplied API Keys

A new deployment-level configuration flag lets you disable the server-side `GEMINI_API_KEY`, requiring every end-user to supply their own custom API key in Engine Controls — perfect for public or shared deployments where you don't want to expose shared API quotas.

- 🚦 **Gate the Server Key** — set `ALLOW_SERVER_ENV_KEY="false"` to block all generation and file upload requests that don't include a user-supplied custom API key. The default is `"true"` (backwards-compatible — existing deployments continue working without changes).
- 🧾 **Differentiated Error Messages** — users see a specific "Server environment API key usage is disabled on this deployment. Please enter your custom Gemini API key in 'Engine Controls'" message instead of a generic "No Gemini API key found" error, providing clear, actionable guidance.
- ⚡ **Per-Request Dynamic Client Instantiation** — the generation handler (`app/api/generate/route.ts`) no longer uses a static module-level `GoogleGenAI` singleton. Instead, it creates a dynamic client instance on every request based on the resolved active API key (custom key first, then server env key if permitted), ensuring the correct key and user-agent are always used.
- 🔧 **Centralized `getActiveApiKey()` Helper** — the Files API upload handler (`app/api/upload-file/route.ts`) extracts a shared helper function that centralizes key resolution logic across all upload actions: direct resumable, chunked proxy, list, delete, and single-file upload. Every action path now gets consistent key enforcement with proper differentiated error responses.

---

### ✨ What's New

- 🎬 **10 new folder-based presets** — Cine DeepDive, Color Mapper, Comp Decoder, Film Lingo, Genre Lexicon, Motion Lab, Scene Lab, Shot Interp, Style Architect, and Vis Narrative replace the 3 original flat JSON presets
- 🔀 **Configurable import strategy** — choose Duplicate (safe, auto-incrementing names) or Replace (in-place overwrite by ID) for preset imports
- 📊 **Redesigned PresetImportConfirmModal** — four-column summary grid, expandable item inspector with per-item action badges, and skip-reason explanations
- 🌐 **Unified URL + local JSON import pipeline** — both routes share the same strategy selector and inspector via `openJsonPresetImport()`
- 🔗 **`preseturl` query parameter** — fifth recognized URL param for remote preset imports
- 📋 **Skip-reason differentiation** — `exact_match` (identical ID) vs. `content_match_different_id` (same name+content, different ID) in import results
- 🚨 **Preset Replace Confirmation Modal** — intercepts Quick Preset Selector switches when unsaved edits exist to prevent accidental data loss
- 💾 **Active preset state persistence** — `loadedPresetId` survives page refreshes via localStorage
- 📸 **Snapshot-based discard** — Configure Prompts modal accurately restores preset state on cancel/discard
- 💙 **Ko-fi Support Button** — standalone `KofiButton` component with environment toggle (`NEXT_PUBLIC_ENABLE_KOFI_BUTTON`)
- 🏷️ **Simplified header buttons** — color-coded single-word labels (Assets/Engine/Prompts/Clear) with mobile icon-only fallback
- 📱 **Mobile responsive layout refinements** — two-row header, hidden Quick Preset Selector, restored Visual Assets section header
- 📝 **Quick Preset Selector row redesign** — 2-line system prompt excerpt preview beneath each preset name; footer button removed
- 📖 **Updated Lab Manual** — refreshed onboarding guide with Files API, preset sharing, and quick tips bar
- 🚦 **ALLOW_SERVER_ENV_KEY flag** — disable the server-side API key to enforce user-supplied keys on deployments
- 🧾 **Differentiated API key error messages** — specific "Server environment API key usage is disabled" guidance vs. generic fallback
- ⚡ **Per-request dynamic GoogleGenAI client** — replaces static module-level singleton in generation handler
- 🔧 **`getActiveApiKey()` shared helper** — centralized key resolution across all Files API upload actions
- 📦 **`PresetImportConfirmModal` component** — extracted import confirmation UI into a standalone, reusable component
- 🪝 **`useUrlPresetImport` custom hook** — ~400+ lines of URL import state management extracted from `app/page.tsx`
- 🔄 **Enhanced `importPresetsFromJSON()`** — supports `importStrategy` option, returns `replacedCount` and `processedItems`, accepts `{ preset: ... }` single-wrapper JSON objects
- 📐 **Per-preset formatting** — fallback `system_prompt.txt` emptied; output formatting rules now defined by each preset individually

### 🐛 Fixed

- ⭐ **Favorites & Pinned Filter Sync in Quick Preset Selector** — ★ Favorites tab and badge counter now check both `pinnedIds` and `preset.isFavorite`, ensuring starred presets appear consistently

### 🔄 Changed

- 📁 **Server-side preset API rewritten for folder-based loading** — `/api/prompt-config` reads presets as folder structures (`meta.json` + `system_prompt.txt` + `prompt_template.txt`) as the primary format, with fallback support for legacy JSON preset files
- 📄 **Default prompt template simplified** — reduced from 23-line creative specification to a bare `{{ visual_references }}` / `{{ idea }}` layout
- 🧹 **Default system prompt stripped** — reduced from 13 lines of Markdown-avoidance rules to essentially empty; formatting now per-preset
- 🧩 **Enhanced `importPresetsFromJSON()`** — replace strategy with in-place overwrite, unique name generation via auto-incrementing suffixes, `{ preset: ... }` single-wrapper JSON support

### 🏗 Architecture & Refactoring

- 📦 **Extracted `PresetImportConfirmModal` component** — the import confirmation UI (preset metadata card, strategy selector, summary grid, expandable item list, workspace-application checkbox, loading spinner, error toast, and success toast) was split into its own component at `components/PresetImportConfirmModal.tsx` with a clean `PresetImportConfirmModalProps` interface.
- 🪝 **Extracted `useUrlPresetImport` custom hook** — ~400+ lines of state management, URL query parameter detection, remote fetch, preset parsing, duplicate evaluation, workspace application, and localStorage persistence were moved from `app/page.tsx` into `hooks/use-url-preset-import.ts`. The hook exposes `openJsonPresetImport()` for triggering the same import workflow from local file uploads and an `onSetImportStrategy` callback for live strategy switching.
- 🧩 **Enhanced `importPresetsFromJSON()` in `lib/preset-export.ts`** — the core import utility now supports a configurable `importStrategy` option (Duplicate vs. Replace), returns `replacedCount` alongside `importedCount` and `skippedCount`, generates unique preset names via auto-incrementing suffixes, and accepts `{ preset: ... }` single-wrapper JSON objects as a valid import source format.
- 🔧 **Centralized `getActiveApiKey()` in `app/api/upload-file/route.ts`** — shared helper function extracts `ALLOW_SERVER_ENV_KEY` logic and key resolution from every upload, list, and delete action path, eliminating duplicated code and ensuring consistent error messaging across all Files API operations.