# Release Notes

---

## v2.2.0: Organize. Visualize. Iterate.

**PromptLab v2.2.0** introduces **multi-project workspace management** with independent IndexedDB-backed workspaces, a redesigned **thinking trace visualization** engine, one-click **Quick Preset Selector** in the navigation bar, and substantial UI density improvements across the entire workspace. This release also extracts the `VisualAssetsSection` into a standalone component, upgrades the IndexedDB schema to v2, and delivers richer history browsing with fuzzy search and inline output excerpts.

---

### ✨ Highlights

#### 📂 Multi-Project Workspace Management

PromptLab graduates from a single-workspace tool to a full multi-project creative environment. Create, rename, switch, and delete independent workspaces — each with its own system instructions, prompt templates, custom presets, generation history, and asset library — all persisted in IndexedDB.

- 🗂️ **Full-screen `ProjectManagerModal`** for browsing, searching, and managing all projects with a toggleable grid/compact view
- 🔄 **One-click project switcher** in the `AppHeader` — swap workspaces without opening the full manager
- 🧬 **"Copy from Current"** — clone your active workspace (prompts, presets, and asset library) into a fresh project for variant exploration without losing the original state
- 📤 **Project import/export with image bundling** — export entire workspaces as versioned JSON files (`promptlab_project` v1.0) with all asset image blobs retrieved from IndexedDB; import validates payloads, restores images, and auto-resolves name collisions with incrementing suffixes
- 📡 **Cross-tab synchronization** — `BroadcastChannel`-based messaging keeps the project dropdown and active workspace in sync across open browser tabs in real time
- 🧳 **Backward-compatible migration** — legacy `localStorage` session data is automatically detected and migrated into a "Main Workspace" default project on first access, with transparent sync to legacy keys so all existing components continue to function without modification

#### 🧠 Thinking Trace Visualization

The engine reasoning trace panel has been completely redesigned to provide clear, real-time insight into the model's internal thought process — now enabled for **all models** (the previous model-name gate has been removed).

- 💡 **Pulsing amber dot + `PROCESSING` badge** during active thinking; transitions to a green dot + `COMPLETED` badge when finished
- 📽️ **Slideshow card mode** during active streaming — the latest parsed reasoning block fades in with a custom `slideFadeIn` CSS animation for smooth, cinematic transitions
- 📜 **Completed full-log mode** — the entire reasoning trace renders as a scrollable markdown-formatted block (`max-h-[180px]`) when generation finishes
- 🔽 **Auto-collapse on output** — the reasoning panel automatically hides once generation output starts streaming, keeping the workspace clean during long generations
- 💾 **Thinking results persisted** in `HistoryItem` objects and restored from `localStorage` — reasoning traces survive page refreshes, history save, and history recall

#### ⚡ Quick Preset Selector & History Refinements

- 🎛️ **`QuickPresetSelector` in `AppHeader`** — rapid one-click switching between system and custom prompt presets directly from the top navigation bar, reducing the need to open the Configure Prompts modal for routine preset changes
- 🃏 **Reusable `HistoryCardSummary` component** — a rich preview card showing timestamp (24-hour format), media badges (IMG/VID counts with icons), model badge, preset badge, title/idea excerpt, and a cleaned markdown-free output excerpt (~220 characters). Integrated consistently across `LoadWorkspaceConfirmModal`, `DeleteHistoryConfirmModal`, and `HistorySection`
- 🔎 **Fuzzy search with tokenized matching** — new `lib/search-utils.ts` module with `normalizeText()` and `matchesSearchQuery()`. History search now correctly matches hyphenated terms (e.g., "sci-fi" ↔ "sci fi") and supports multi-word keyword queries across all search scopes
- 📝 **Output excerpt preview in history list items** — a 2-line italic excerpt of the cleaned generation output (~140 characters) appears beneath each history card in the `HistoryViewerModal` sidebar, giving quick context without opening the detail panel
- 👆 **Auto-scroll to selected history item** — `scrollIntoView` with smooth behavior ensures the active item is always visible in long history lists
- ❌ **Clear search button** — a dismiss `X` inside the history search input for one-click query clearing

#### 🎨 UI Polish & Density

- 📐 **Compact 5-column visual asset grid** — refined from 4 columns to `md:grid-cols-3 lg:grid-cols-5` with reduced internal padding and gaps across `VisualAssetCard`, `VideoAssetCard`, and the drag-and-drop uploader for significantly denser information layout
- 🖼️ **Aspect-ratio-preserving hover previews** — image hover previews now use `object-contain` with dynamic `w-fit max-w-[340px]` sizing, displaying each reference at its natural proportions rather than a rigid square box
- 📥 **Collapsible generation result** — the output panel now supports collapsing with state persisted in `localStorage` for session-to-session continuity
- 📋 **Enhanced copy button** — redesigned with `Copy` / `Check` (checkmark on success) `lucide-react` icons alongside the text label, replacing the plain text-only button
- 🔢 **Live character count badge** — `{N} CHARS` using `toLocaleString()` formatting appears next to copy/expand controls when output is present
- ⏱️ **Preset timestamp metadata** — `createdAt` and `updatedAt` fields added to all presets (system + custom), with date-based sorting options and a `formatPresetDateShort` helper for consistent date display
- ◀️ **Standardized section chevrons** — all accordion sections now use `ChevronRight` (▶) when collapsed and `ChevronDown` (▼) when expanded, following standard UI conventions
- 📄 **Unified export filename convention** — all export types (assets, history, presets, projects) follow `promptlab_{projectSlug}_{feature}_{date}_{time}_{uniqueId}.json` with a shared `slugify()` helper; asset library JSON exports are now pretty-printed with 2-space indentation

---

#### ✨ What's New

- 📂 **Multi-project workspace management** — `lib/projects.ts` + `ProjectManagerModal` with full CRUD, import/export, and IndexedDB persistence
- 🔄 **Project switcher in AppHeader** — compact dropdown for one-click workspace switching
- 🧬 **"Copy from Current" project creation** — clone the active workspace into a new project instantly
- 📡 **Cross-tab project synchronization** via `BroadcastChannel` (`promptlab_project_sync_channel`)
- 🧳 **Backward-compatible migration** — legacy `localStorage` data auto-migrated to "Main Workspace" project on first access
- 🎛️ **`QuickPresetSelector` component** — rapid preset switching from the top navigation bar
- 🧠 **Redesigned thinking trace visualization** — pulsing amber dot during processing, slideshow card mode with `slideFadeIn` animation, completed full-log view with markdown rendering, and auto-collapse behavior
- 🌐 **Universal thinking/reasoning for all models** — server-side `includeThoughts: true` for every model (model-name gate removed)
- 🃏 **`HistoryCardSummary` reusable component** — rich preview cards with timestamp, media badges, model, preset, and output excerpt
- 🔎 **Fuzzy search utility** (`lib/search-utils.ts`) — tokenized matching with hyphen/punctuation normalization
- 📝 **Output excerpt previews** in `HistoryViewerModal` list items (~140 characters, cleaned markdown)
- 👆 **Auto-scroll to selected history item** with smooth behavior
- ❌ **Clear search button** (`X`) in history viewer search input
- 📥 **Collapsible generation result section** with `localStorage`-persisted state
- 📐 **Compact 5-column visual asset grid** — denser layout with reduced padding and gaps
- 🖼️ **Aspect-ratio-preserving hover previews** — `object-contain` with dynamic max-width
- ⏱️ **Preset timestamp metadata** — `createdAt` / `updatedAt` fields with date-based sorting
- 📋 **Enhanced copy button with icons** — `Copy` / `Check` lucide-react icon states
- 📄 **Unified export filename convention** — all exports follow `promptlab_{projectSlug}_{feature}_{date}_{time}_{uniqueId}.json` with pretty-printed asset library JSON
- 🎨 **`@keyframes slideFadeIn` CSS animation** in `globals.css` for smooth section transitions

#### 🐛 Fixed

- 🐛 **Standardized section accordion chevrons** across `VisualAssetsSection`, `LabManualSection`, `HistorySection`, and preset list accordions — now consistently using `ChevronRight` (collapsed) / `ChevronDown` (expanded)
- 🐛 **Project management stability** — `isSwitchingProjectRef` guard prevents auto-save and asset-library callbacks from firing during active project switches, eliminating state race conditions
- 🐛 **Zero-projects fallback** — `handleProjectsUpdated()` auto-creates a default workspace when no projects exist
- 🐛 **Project deletion fallback** — enhanced flow ensures the active project correctly falls back to the next available project after deletion
- 🐛 **Persistence layer** — updated to support both legacy (`prompt_generator_history`) and current (`prompt_generator_history_v1`) localStorage history keys

#### 🔄 Changed

- ⚡ **Compact 5-column visual asset grid** — refined from 4 columns to `md:grid-cols-3 lg:grid-cols-5` with tighter internal spacing
- ⚡ **Hover preview preserves original image aspect ratio** — `object-contain` with dynamic sizing replaces fixed 280px square preview
- ⚡ **HistorySection header restructured** — inline "Clear All" button removed (now only in full `HistoryViewerModal`), expand/collapse chevrons moved left, layout reorganized for cleaner filter tab separation
- ⚡ **History Viewer sidebar visual refresh** — selected items use warm amber highlight (`bg-[#FEF3C7]`) instead of dark left-border, non-selected items have transparent border for consistent alignment, card spacing tightened, titles use single-line truncation
- ⚡ **Default history search simplified to title-only** — no longer matches against timestamp or model fields for more predictable results
- ⚡ **Unified export filename convention** — all export types use `promptlab_{projectSlug}_{feature}_{date}_{time}_{uniqueId}.json` with shared `slugify()` helper; `projectName` prop threaded through components for project-aware filenames
- ⚡ **Asset library JSON pretty-printed** — `JSON.stringify` with 2-space indentation for readability

#### 🏗️ Architecture

- 🏗️ **Extracted `VisualAssetsSection` component** — the visual reference assets, casting maps, drag-and-drop uploader, YouTube URL trigger, library browser, error/warning alerts, image cards, and video cards were extracted from `app/page.tsx` into a modular, standalone component with section collapsibility and persistent open/collapsed state in `localStorage`
- 🏗️ **IndexedDB schema upgrade (v1 → v2)** — new `projects` object store added alongside the existing `images` store. Project data (configuration, presets, history, and asset metadata) now persists in IndexedDB instead of localStorage, removing the ~5–10MB quota constraint for session data
- 🏗️ **Centralized search utilities** (`lib/search-utils.ts`) — `normalizeText()` and `matchesSearchQuery()` provide consistent fuzzy search with hyphen/punctuation normalization, extracted from the history viewer for potential reuse in asset library and preset search

---

#### ⬆️ Upgrade Notes

- ✅ **No breaking changes.** All existing localStorage data, IndexedDB images, history items, custom presets, and project configurations are fully compatible with v2.2.0.
- 🧳 **Automatic legacy migration** — on first access after upgrading, legacy `localStorage` session data (prompts, presets, history, and asset library images) is automatically detected and migrated into a "Main Workspace" default project in IndexedDB. The active project's data is synced back to legacy `localStorage` keys transparently, so no data is lost and all components continue working without modification.
- 📡 **Cross-tab synchronization** — if you have multiple browser tabs open with an older version of PromptLab, project-switch events broadcast from v2.2.0 tabs may not be understood by older tabs. Recommend closing all tabs and reopening after upgrading.
- 💾 **IndexedDB schema v2** — the database is automatically upgraded on first load. The new `projects` object store is created without affecting the existing `images` store. No manual migration steps required.

---

#### 🔗 Resources

- 📋 **Full Changelog**: https://github.com/taruma/PromptLab/compare/v2.1.0...v2.2.0

---

---

## v2.1.0: Capture. Compare. Export.

**PromptLab v2.1.0** introduces **multi-modal video references** (MP4 uploads + YouTube URLs), Markdown-rendered generation output, history diff comparison, asset library import/export, and a major architecture refactor extracting 9 reusable components from the monolithic workspace.

---

### ✨ Highlights

#### 🎬 Multi-Modal Video & YouTube Support

PromptLab now supports video references alongside images. Upload MP4 files (≤30 seconds, ≤35 MB) or add YouTube URLs — both map to `@videoN` annotations in your prompt templates and stream to Gemini as `inlineData` / `fileData` parts.

- 📹 **Local MP4 upload** with automatic validation and Base64 encoding
- ▶️ **YouTube URL references** with auto-extracted thumbnails and embedded iframe previews
- 🔗 **Unified `{{ visual_references }}` pipeline** combining all image and video assets server-side
- 🃏 **Three-state `VideoAssetCard`** handles YouTube (playable), cached MP4 (playable), and uncached historical MP4 (NO LOCAL STREAM placeholder)
- 🖥️ **Full-screen `VideoPlayerModal`** for pre-generation preview of both MP4 and YouTube references
- 💾 **Video metadata preserved in history** — recall, export, and import with purple `{N} VID` badges

#### 📝 Markdown-Enabled Output Rendering

The generation output panel now supports a **Formatted Markdown / Raw Monospace** toggle. Output is rendered with `react-markdown` using custom-styled headings, lists, bold, italic, inline code, and horizontal rules — all in PromptLab's brutalist aesthetic. The raw monospace view remains available for users who prefer the original plain-text output.

#### 🔍 History Diff Compare

A new `[Diff]` button in the `HistoryViewerModal` detail panel opens the shared `PresetCompareModal` to show line-by-line differences between a saved history item's prompt configuration and your current active workspace. Audit how your system instructions and prompt templates have evolved over time with unified or split diff views.

#### 📤 Asset Library Import & Export

The asset library now supports JSON export (All or Selected images) and import with automatic duplicate detection. Previously exported library files can be re-imported, with a processing summary reporting total imported, duplicates skipped, and errors encountered.

#### 🟢 Optional Core Idea

The Main Objective / Idea field is no longer required for generation. You can now run generations using only dynamic parameters and your prompt template — useful for lightweight testing or pure template-driven workflows.

---

#### ✨ What's New

- ✨ **Markdown rendering toggle** in generation output (Formatted / Raw) via `GenerationResultView`
- ▶️ **YouTube URL video references** with `@videoN` mapping, thumbnail extraction, and iframe preview
- 🎬 **Multi-modal video support** — MP4 upload with validation, Base64 encoding, and unified reference pipeline
- 📦 **`VideoAssetCard` component** with three-state rendering (YouTube / cached MP4 / uncached MP4)
- 📦 **`VideoPlayerModal` component** for full-screen video preview (HTML5 + YouTube iframe)
- 💾 **Video history tracking** — metadata persists across sessions, exports, and imports
- 🎨 **`YouTubeIcon` custom SVG component** replacing all `lucide-react` Youtube imports
- 📤 **Asset library JSON export and import** with duplicate detection
- 🔍 **History diff compare** via shared `PresetCompareModal`
- 🟢 **Optional Core Idea** — generation works without the Main Objective field
- 💬 **`PromptTemplateHelpTooltip` component** for inline `{{ variable }}` syntax guidance

#### 🐛 Fixed

- 🐛 Empty-string prompt inputs are no longer overwritten by filesystem template defaults
- 🐛 History cards for custom prompts now show a `CUSTOM` badge
- 🐛 Broken YouTube thumbnails gracefully degrade to a `YouTubeIcon` placeholder

#### 🔄 Changed

- ⚡ Simplified history item loading — centralized state management handles restoration
- ⚡ "Reset Prompts" now clears the editor client-side for instant feedback

#### 🏗️ Architecture

- 🏗️ Extracted 9 reusable components from `page.tsx`: `AppHeader`, `FooterStatusBar`, `LabManualSection`, `MainIdeaSection`, `ParameterInputsSection`, `ClearSessionConfirmModal`, `DeleteHistoryConfirmModal`, `DiscardChangesConfirmModal`, `LoadWorkspaceConfirmModal`
- 📉 Main workspace file reduced by ~475 lines (net)

---

#### ⬆️ Upgrade Notes

- ✅ **No breaking changes.** All existing localStorage data, IndexedDB images, history items, and custom presets are fully compatible with v2.1.0.
- 💾 Video references added to history before upgrading from v2.0.0 will not contain video metadata — only generations created in v2.1.0+ will include the new `videos` field.
- 🎨 The `lucide-react` `Youtube` icon is no longer used; a custom `YouTubeIcon` SVG component replaces it throughout the UI.

---

#### 🔗 Resources

- 📋 **Full Changelog**: https://github.com/taruma/PromptLab/compare/v2.0.0...v2.1.0

---

---

## v2.0.0: Recall, Reuse, Refine.

**PromptLab v2.0.0** is a major feature release that transforms the workspace from a single-session prompt tester into a **persistent creative environment**. This release introduces a fully overhauled **Session History** system with favorites and import/export, a cross-workspace **Asset Library** for reusable reference images, a **multi-key API Key Vault**, a **side-by-side Preset Diff Viewer**, **bulk preset export/import**, and significant UI refinements. Under the hood, the codebase was modularized with shared utilities, extracted components, and centralized IndexedDB helpers.

---

### 📦 What's New

#### 🕘 Session History (Fully Overhauled)

- **Favorite toggle & filter tabs** — Mark generations as favorites for quick access. Browse with three tabs: All, Favorites, and Recent.
- **Full-screen HistoryViewerModal** — Browse, search, rename, and load previously saved prompt iterations with full metadata (timestamp, model, temperature, thumbnail previews).
- **Collapsible inline history panel** — The `HistorySection` sidebar component shows recent generations without opening a full modal.
- **History JSON import & export** — Export history data as JSON files for backup or cross-device migration. Filenames include date, compact timestamp, and a unique 4-character suffix. Import files back through the HistoryViewerModal.
- **Decoupled history image IDs** — History images use unique `hist-img-{timestamp}-{idx}-{random}` identifiers completely independent of active session image IDs. Deleting or modifying workspace images never breaks previously saved historical references.
- **Deterministic variable storage** — History entries store clean, resolved copies of template variables, eliminating stale or misleading dynamic parameter values on recall.
- **Legacy history auto-migration** — Old-format entries are automatically migrated to the current format on app load.
- **Clear history with confirmation** — A dedicated confirmation modal warns before permanently deleting all history items and their associated IndexedDB images.

#### 🖼️ Asset Library

- **Persistent image library sidebar** — Upload, browse, search, rename, sort (by name or date), and delete reference images stored in IndexedDB independently of any workspace session. Toggle between list and grid views.
- **Cross-workspace image reuse** — Add library images to the active workspace with a single click, automatically creating `@imageN` references with the library label — no need to re-upload.
- **Resizable sidebar width** — Drag the divider to adjust the Asset Library sidebar width; the setting persists in `localStorage` across sessions.
- **Upload deduplication** — Duplicate images with matching base64 content are detected and prevented.
- **Dedicated VisualAssetCard component** — A reusable card layout with hover preview, shared between the workspace sidebar and the asset library for consistent display.

#### 🔑 API Key Vault

- **Multi-key vault with add, switch, and delete** — Manage multiple labeled Gemini API keys from a single collapsible vault in the Engine Controls modal. Existing legacy single keys are automatically migrated into the vault on first access.
- **Active key label in workspace footer** — The label of the currently selected custom API key is displayed next to the system status indicator, so you always know which key is in use.

#### ⚙️ Presets & Configuration

- **Update existing presets** — A dual-mode control panel offers "Update Preset" (overwrite the selected preset) and "Save As New" (create a cloned copy), alongside a "[Deselect]" button to start a fresh workspace.
- **Active & edited state tracking** — Visual badges show `[ACTIVE]` in emerald when a preset matches the editor content, and `[EDITED]` in pulsing amber when the editor has diverged from the saved version.
- **Preset search & three-tab filtering** — Search presets by name and filter with a three-tab toggle (All / System / User) showing count badges. The active tab selection persists across sessions.
- **Workspace actions dropdown** — Import JSON, Export JSON, and Reset to TXT Files are consolidated into a single compact "Config Options" menu.
- **Discard confirmation on unsaved changes** — Closing the Configure Prompts modal or pressing ESC with unsaved edits now prompts a confirmation dialog to prevent accidental data loss.

#### 🔍 Preset Compare & Diff Viewer

- **Side-by-side diff viewer** — When browsing presets, a "Compare" button opens a full-screen modal showing line-by-line differences between the current editor content and any saved preset's configuration.
- **Unified & split views** — Toggle between inline (unified) and side-by-side (split) diff layouts with green/red color-coded additions and deletions.
- **"Changes Only" filter** — A git-style context-window filter collapses unchanged regions to 3-line context blocks with `<skipped N lines>` markers, toggleable to full file view.
- **Built on a custom LCS diff engine** — A Longest Common Subsequence algorithm (`computeLineDiff`) generates precise line-by-line change data with line number tracking.

#### 📤 Bulk Preset Export & Import

- **Export dropdown with three modes** — Export All, Export Favorites, or Export Active Preset from a compact dropdown in the Configure Prompts header. Each option shows a live count badge.
- **Versioned JSON payload** — Exports produce a `promptlab_presets_{tag}_{date}_{time}_{uniqueId}.json` file with version, timestamp, type tag, item count, and an array of preset objects.
- **Duplicate-aware import** — Import validates JSON structure (accepts raw arrays, wrapped arrays, or single objects). Duplicates are detected by matching both ID and name+content combinations, with skipped entries reported in the import summary.
- **Favorite/pinned reconciliation** — On import, any preset marked as favorite is automatically added to the pinned IDs set.

#### 🎛️ Engine Controls

- **Dedicated EngineControlsModal** — All engine configuration (model selection, temperature, reasoning effort, max tokens, API key vault) is now in a focused modal dialog, extracted from the main workspace.
- **Collapsible advanced settings** — Temperature and max output token controls are hidden behind an expandable "Advanced" section to reduce clutter.
- **Redesigned model selection** — The model picker and surrounding UI were refreshed for clearer navigation and feedback.

#### ✨ UI Improvements

- **Live character count badge** — A `{N} CHARS` badge appears next to the "Generation Result" header whenever output is present.
- **Truncated long titles & names** — History idea titles exceeding 100 characters are truncated to prevent layout breakage. Overly long preset names in modals are also truncated for readability.
- **Updated application icons** — All favicon and app icon assets were refreshed across platforms (favicon, Android Chrome, Apple touch icon, and logo).
- **Polished input transitions** — The idea textarea transition was changed to colors-only to prevent subtle layout shifts on focus.

---

### 🛠️ Under the Hood

- **Centralized IndexedDB helpers** (`lib/indexeddb.ts`) — Database open, save, get, and delete operations shared across components.
- **Centralized utility functions** (`lib/utils.ts`) — URL helpers, LCS diff engine, and image compression logic extracted from the main page.
- **Dedicated history export module** (`lib/history-export.ts`) — JSON import/export logic encapsulated for maintainability.
- **Dedicated preset export module** (`lib/preset-export.ts`) — Bulk JSON export/import with duplicate detection and pinned-ID reconciliation.
- **Extracted components** — `HistorySection`, `VisualAssetCard`, `PresetCompareModal`, `PresetExportDropdown`, and `EngineControlsModal` were extracted from the monolithic page into reusable, testable components.
- **Vercel Analytics** — Integrated in the root layout for deployment observability.

---

#### ⬆️ Upgrade Notes

- **Legacy history auto-migration** — Old-format history entries in `localStorage` are automatically migrated to the current format on first load. No manual action required.
- **API key vault migration** — Any existing legacy single API key stored in `localStorage` is automatically migrated into the new multi-key vault on first access.
- **No breaking changes** — All v1.0.0 workspace configurations, presets, and stored data are fully compatible with v2.0.0.

---

#### 📝 Full Commit History

See [CHANGELOG.md](./CHANGELOG.md) for the complete 42-commit breakdown, or view the [full diff on GitHub](https://github.com/taruma/PromptLab/compare/v1.0.0...v2.0.0).

---

---

## v1.0.0: Sketch. Generate. Refine.

**PromptLab** is a creative workspace for drafting and iterating on AI prompt templates. Write system instructions and prompt templates with `{{ dynamic_variables }}`, attach reference images, and test against Google Gemini in real time. This initial release ships the full editing, generation, and persistence pipeline.

---

### ✨ Highlights

- **Dynamic Template Engine** — Add `{{ placeholders }}` to your prompt template and input fields appear automatically. The reserved `{{ idea }}` key gets a dedicated full-width text area. Use `{{ visual_references }}` (or `{{ cast }}` — they're interchangeable) to auto-populate image annotations.
- **Visual Reference Pipeline** — Drag and drop images into the workspace. Each asset is auto-mapped to sequential `@image1`, `@image2` labels with editable cast names. Images are compressed to high-quality JPEG (90%) with alpha flattening via HTML Canvas.
- **Multi-Modal Generation** — Uploaded images and compiled text are sent together as Gemini `inlineData` parts. One request carries the full creative brief.
- **Real-Time SSE Streaming** — Output streams word-by-word via Server-Sent Events, so you see results as they're generated — no waiting for a full response.
- **Engine Controls** — Switch between three Gemini models (3.5 Flash, 3.1 Flash Lite, 3.1 Pro Preview), tune temperature (0.0–2.0), set reasoning effort (HIGH/MEDIUM/LOW/MINIMAL), and cap max output tokens. Bring your own API key — it stays client-side and rides through the server proxy.
- **Session History & Presets** — Past generations are saved locally and recallable with a click. Save, load, export, and share your own custom presets as JSON — or import one via a URL query parameter.

---

### 🎨 Dynamic Template System

PromptLab parses `{{ variable_name }}` placeholders from your template and builds the input form on the fly. No configuration files, no hardcoded fields. The reserved keys work as follows:

| Placeholder | Behavior |
|---|---|
| `{{ idea }}` | Full-width text area — "Main Objective / Idea" |
| `{{ visual_references }}` or `{{ cast }}` | Auto-populated from uploaded image labels (e.g., `@image1 as Character Name, @image2 as Setting`) — these are interchangeable |
| *Everything else* | Auto-generated text input with transformed label (e.g., `{{ brand_voice }}` → "Brand Voice") |

Edit templates live in the **Configure Prompts** modal. A live variable counter updates as you type so you can see exactly what the form will produce.

### 🖼️ Visual References & Multi-Modal

Upload images by dragging them onto the drop zone or clicking to browse. Each file is processed through an HTML Canvas pipeline:

1. PNG transparency is flattened to a white background
2. Output is compressed to JPEG at 90% quality
3. Files under ~40KB bypass compression entirely

The resulting images are stored in **IndexedDB** (`promptlab_db`) to avoid browser localStorage quota limits (~5–10MB). Only metadata (id, label, mimeType) is kept in localStorage. Legacy images with inline Base64 are auto-migrated on app load.

Labels map each image to a cast or setting name. When generating, images are injected as Gemini `inlineData` parts alongside the compiled prompt — the model sees both your text and your visuals in one request.

### ⚡ Real-Time Streaming

Generation uses Server-Sent Events, streaming output word-by-word as Gemini writes. A pulsing green indicator in the output panel confirms the streaming state. The client implements a custom chunk buffer to gracefully handle fragmented JSON packets.

### 🎛️ Engine Controls

The **Engine Settings** modal exposes full control over generation parameters:

| Setting | Options | Default |
|---|---|---|
| **Model** | `gemini-3.5-flash` · `gemini-3.1-flash-lite` · `gemini-3.1-pro-preview` | 3.5 Flash |
| **Reasoning Effort** | `HIGH` · `MEDIUM` · `LOW` · `MINIMAL`* | MEDIUM |
| **Temperature** | 0.0 (deterministic) to 2.0 (highly creative) | 1.0 |
| **Max Tokens** | Freeform number or blank (auto) | Blank |

> \* `gemini-3.1-pro-preview` does not support `MINIMAL` reasoning effort. Selecting Pro automatically upgrades the level to `HIGH` if `MINIMAL` was active.

A **Custom API Key** field lets you override the server's default key with your own. The key is stored exclusively in browser `localStorage` and passed to the server proxy as a POST parameter — never exposed client-side. A **Reset Defaults** button restores the baseline configuration in one click.

Active engine parameters (model, reasoning level, temperature) are displayed in the footer status bar at all times.

### 📦 Example Presets

Three example presets are included to demonstrate what's possible, but **PromptLab is designed for you to bring your own system instructions and templates.** Edit freely or start from scratch via the Configure Prompts panel.

- 🎭 **AI Casting & Screenplay** — Character-driven dramatic narratives
- 🎬 **AI Director & Storyboard** — Cinematic pre-production and visual planning
- 🌍 **VFX & Speculative Worldbuilder** — Virtual production and world design

### 🔧 Other Features

- **Plain-Text Output Enforcement** — System instructions mandate pure plain-text output (no Markdown, asterisks, hash headers, backticks, or tables). Output is rendered in a `font-serif` prose panel.
- **Session History** — Past generations stored with full context (variables, images, output). Click any entry to restore the entire session. Delete individually or clear in bulk.
- **Custom Presets** — Save, load, delete, export as downloadable JSON, and import from JSON files. Share presets via URL query parameters (`?presetUrl=`, `?configUrl=`, `?preset=`, or `?config=`). GitHub blob URLs are auto-converted to raw URLs.
- **Collapsible Lab Manual** — Built-in 4-step quick-start guide with persistent open/closed state.
- **Collapsible Session History** — Toggle the history panel visibility.
- **Compiled Prompt Inspector** — Expandable accordion below the output area showing the fully resolved prompt sent to Gemini.
- **Escape Key** — Dismisses all open modal dialogs (Prompt Config, Engine Controls, Clear Session, URL Import).
- **Clear Session Confirmation** — Modal dialog confirming what gets cleared (inputs, images, output) with explicit note that custom prompts and presets remain intact.
- **Storage Quota Warning** — Dismissible amber banner if browser storage limits are hit during image save.
- **Footer Status Bar** — Dark bar displaying active engine model, reasoning level, and temperature.

---

### 🚀 Installation

```bash
git clone https://github.com/taruma/PromptLab.git
cd PromptLab && npm install
```

Set your API key (optional — you can provide one in-app):

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Requirements:** Node.js 18+ · [Google Gemini API Key](https://aistudio.google.com/apikey)

---

**⭐ Star on GitHub** · [taruma/PromptLab](https://github.com/taruma/PromptLab)
<br>**🌐 Live Deployment** · [promptlab.taruma.my.id](https://promptlab.taruma.my.id)
<br>**📄 License** · MIT © [Taruma Sakti](https://github.com/taruma)