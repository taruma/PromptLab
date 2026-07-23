# Changelog

All notable changes to PromptLab, a playground for drafting and iterating on AI prompt templates.

---

## [Unreleased]

### Generation & Usability

- **Optional Core Idea:** Unlocked generation without requiring the Main Objective / Idea field to be filled. Users can now synthesize sequences using only other prompt parameters or pure templates.

### Multi-Modal Video & YouTube Support

- **YouTube URL video references.** Added an "ADD YOUTUBE URL" button to the left of "Browse Library" in the Visual Assets header. Users can enter any YouTube URL (e.g. `youtube.com/watch?v=...` or `youtu.be/...`) and map it to a custom label.
- **Unified `@video` annotation mapping.** YouTube video references maintain standard `@videoN` tag mappings alongside local MP4 uploads, populating `{{ visual_references }}` as `@videoN as Label` without embedding raw links in prompt texts.
- **Gemini API `fileData` streaming.** YouTube URLs are transmitted directly to the Gemini API as `fileData` parts (`fileUri: youtubeUrl`), allowing Gemini 3.5 Flash to process YouTube video context natively.
- **YouTube thumbnail previews & iframe embed player.** `VideoAssetCard` renders auto-extracted high-resolution YouTube thumbnails with a red YouTube badge (`YT`), and `VideoPlayerModal` embeds the YouTube iframe player for instant in-app video previews.
- **YouTube history persistence.** Generation history persists YouTube URLs and metadata across sessions, JSON exports, and imports, displaying red YouTube badges in `HistoryViewerModal`.
- **Video validation and processing.** A dedicated `validateAndProcessVideo` utility in `lib/video-utils.ts` enforces format (MP4 only), duration (≤30 seconds), and file size (≤35 MB) constraints before Base64 encoding. Invalid files receive clear, specific error messages.
- **VideoAssetCard component.** Reusable UI card (`components/VideoAssetCard.tsx`) for displaying uploaded videos in the workspace sidebar with metadata (duration, dimensions) and a playback trigger.
- **VideoPlayerModal component.** Full-screen modal (`components/VideoPlayerModal.tsx`) for previewing uploaded reference videos before generation, with standard HTML5 video controls.
- **Unified reference tag pipeline.** Images (`@imageN`) and videos (`@videoN`) are now combined into a single `referenceTags` array server-side, producing a consolidated `{{ visual_references }}` variable that lists all media assets with their labels in the prompt template.

### History & Session Management

- **Video history tracking.** The `HistoryItem` interface now includes an optional `videos` field, persisting video metadata (label, mimeType, duration) alongside image references in session history. History recall restores uploaded video metadata to the workspace, and history export/import preserves video references for cross-device migration.
- **Video badges in history UI.** History cards in both the sidebar `HistorySection` and full-screen `HistoryViewerModal` display purple `{N} VID` badges alongside existing `{N} IMG` badges, giving at-a-glance visibility of video assets per entry.
- **Video-aware visual reference search.** The history search scope "Visual References & Casting Maps" now matches against both image and video labels, ensuring video-labeled entries appear in filtered results.
- **Video assets in detail view & interactive YouTube playback.** The HistoryViewerModal's detail panel renders video entries under "Visual References & Casting Maps". Clicking any YouTube video card (`[YT ▶ PLAY]`) in history immediately opens the embedded `VideoPlayerModal` iframe player to preview the referenced YouTube clip directly within the history viewer.

### UI & Configuration

- **Custom YouTubeIcon SVG component.** Replaced all `lucide-react` `Youtube` icon imports with a dedicated inline SVG component (`components/YouTubeIcon.tsx`), ensuring consistent YouTube branding across `VideoAssetCard`, `VideoPlayerModal`, `AddYouTubeModal`, and `HistoryViewerModal`.
- **Simplified prompt reset.** The "Reset Prompts" action (formerly "Reset to TXT") now clears the preset editor client-side instead of fetching defaults from the API, providing instant feedback without a network round-trip. This also deselects any loaded preset.

### Asset Library Import & Export

- **Asset library JSON export.** A compact `AssetExportDropdown` in the asset library header supports exporting All or Selected images as a versioned JSON file (`promptlab_asset_library_{tag}_{date}_{time}_{uniqueId}.json`). The exported filename is displayed in a success toast for easy reference.
- **Asset library JSON import.** An `AssetImportModal` allows importing previously exported asset library JSON files, with automatic duplicate detection — images matching existing entries by ID or label+content are skipped, and a summary reports total imported, duplicates, and errors after processing.

---

## [v2.0.0] — July 22, 2026

### History Management

- **Clear history with a dedicated confirmation modal.** Clicking "Clear All History" opens a warning dialog before permanently deleting all history items and their associated images from IndexedDB.
- **Full-screen HistoryViewerModal.** Browse, search, rename, and load previously saved prompt iterations with full metadata — timestamp, model, temperature, and thumbnail previews.
- **Favorite toggle and filter tabs.** Mark generation entries as favorites for quick access. Three filter tabs (All, Favorites, Recent) help narrow down entries.
- **Collapsible history section in the sidebar.** An inline expandable panel (`HistorySection`) shows recent generations without opening a full modal.
- **History JSON import and export.** Export history data as JSON files for backup or cross-device migration. Exported filenames include the date, a compact timestamp, and a unique 4-character suffix. Import files back through the HistoryViewerModal.
- **Visual badges on history items.** Each entry shows metadata like model and generation status at a glance.
- **Legacy history auto-cleanup and format migration.** Old-format entries are automatically migrated to the current format on app load.
- **Deterministic variable storage.** History entries now store clean, resolved copies of template variables, eliminating stale or misleading dynamic parameter values on recall.
- **Decoupled history image IDs.** History images use unique `hist-img-{timestamp}-{idx}-{random}` identifiers completely independent of active session image IDs. Deleting or modifying images in the current session never breaks previously saved historical references.

### API Key Vault

- **Multi-key vault with add, switch, and delete.** Manage multiple labeled Gemini API keys from a single vault in the Engine Controls modal. Any existing legacy single keys are automatically migrated into the vault on first access.
- **Collapsible vault section.** The vault panel can be collapsed when not actively managing keys, reducing visual clutter.
- **Active key label in the workspace footer.** The label of the currently selected custom API key is displayed next to the system status indicator, so you always know which key is in use.

### Asset Library

- **Persistent image library sidebar.** Upload, browse, search, rename, and delete reference images stored in IndexedDB independently of any workspace session. Upload deduplication prevents storing the same image twice.
- **Cross-workspace image reuse.** Add library images to the active workspace with a single click, automatically creating `@imageN` references with the library label.
- **Resizable sidebar width.** Drag the divider to adjust the Asset Library sidebar width; the setting is persisted in localStorage for future sessions.
- **Dedicated VisualAssetCard component.** Reusable card layout with hover preview, shared between the workspace sidebar and the asset library for consistent asset display.

### Presets & Configuration

- **Update existing presets.** The sidebar now offers a dual-mode control panel with "Update Preset" (overwrite the selected preset) and "Save As New" (create a cloned copy), alongside a "[Deselect]" button to start a fresh workspace.
- **Active and edited state tracking.** Visual badges show `[ACTIVE]` in emerald when a preset matches the editor content, and `[EDITED]` in pulsing amber when the editor has diverged from the saved version.
- **Preset search and three-tab filtering.** Search presets by name and filter with a three-tab toggle (All, System, User) showing count badges. The active tab selection is persisted across sessions.
- **Workspace actions dropdown.** Import JSON, Export JSON, and Reset to TXT Files are consolidated into a single compact "Config Options" menu, freeing sidebar space.
- **Discard confirmation on unsaved changes.** Closing the Configure Prompts modal or pressing ESC with unsaved edits now prompts a confirmation dialog to prevent accidental data loss.

### Preset Compare & Diff Viewer

- **Side-by-side diff viewer.** When browsing presets, a "Compare" button opens a full-screen modal showing line-by-line differences between the current editor content and the selected preset's configuration.
- **Unified and split views.** Toggle between inline (unified) and side-by-side (split) diff layouts with green/red color-coded additions and deletions.
- **"Changes Only" filter.** A git-style context-window filter collapses unchanged regions to 3-line context blocks with `<skipped N lines>` markers, toggleable to full file view.
- **Built on a custom LCS diff engine.** A Longest Common Subsequence algorithm (`computeLineDiff`) generates precise line-by-line change data with line number tracking for accurate comparisons.

### Preset Export & Import

- **Bulk export dropdown.** A compact dropdown menu (`PresetExportDropdown`) in the Configure Prompts modal header supports exporting user presets in bulk with three modes: Export All, Export Favorites, and Export Active Preset. Each option shows a live count badge.
- **Versioned export payload.** Exports produce a JSON file (`promptlab_presets_{tag}_{date}_{time}_{uniqueId}.json`) conforming to the `PresetExportPayload` interface with version 1.0, export timestamp, type tag, item count, and an array of `UserPreset` objects.
- **UserPreset interface.** Defined in `lib/preset-export.ts`, each preset carries an `id`, `name`, `systemPrompt`, `promptTemplate`, and optional `isFavorite` flag, shared between the Configure Prompts modal and the export dropdown.
- **Duplicate-aware import.** The `importPresetsFromJSON` utility validates imported JSON structure (accepts raw arrays, `presets`-wrapped arrays, `items`-wrapped arrays, or single objects). Duplicates are detected by matching both ID and name+content combinations, with skipped entries reported in the import summary.
- **Favorite/pinned reconciliation.** The export utility reconciles `isFavorite` status using `pinnedPresetIds`. On import, any preset marked as favorite/pinned is automatically added to the pinned IDs set.
- **Filename conventions.** Export filenames include the date (YYYY-MM-DD), a compact timestamp (HHMMSS), and a unique 4-character random suffix. For active preset exports, the preset's slugified name is used as the tag instead of the export type.

### Engine Controls

- **Dedicated EngineControlsModal.** All engine configuration — model selection, temperature, reasoning effort, max tokens, and API key vault — was extracted from the main workspace into a focused modal dialog.
- **Collapsible advanced settings.** Temperature and max output token controls are hidden behind an expandable "Advanced" section to reduce clutter.
- **Updated model selection interface.** The model picker and its surrounding UI were redesigned for clearer navigation and feedback.

### UI Improvements

- **Live character count badge.** A `{N} CHARS` badge appears next to the "Generation Result" header whenever output is present, giving immediate feedback on output length.
- **Truncated long titles and names.** History idea titles exceeding 100 characters are truncated to prevent layout breakage. Overly long preset names in modals are also truncated to keep confirmations readable.
- **Updated application icons.** All favicon and app icon assets were refreshed across platforms (favicon, Android Chrome, Apple touch icon, and logo).
- **Polished input transitions.** The idea textarea transition was changed to colors-only to prevent subtle layout shifts on focus.

### Architecture & Documentation

- **Centralized IndexedDB helpers** in `lib/indexeddb.ts`. Database open, save, get, and delete operations are shared across components, eliminating code duplication.
- **Centralized utility functions** in `lib/utils.ts`. URL helpers, the LCS diff engine, and image compression logic were extracted from the main page for better code organization and reusability.
- **History export utilities** in `lib/history-export.ts`. JSON import and export logic is encapsulated in a dedicated module for maintainability.
- **Preset export utilities** in `lib/preset-export.ts`. Bulk JSON export and import logic for user presets with duplicate detection and pinned-id reconciliation, shared across the Configure Prompts modal and the PresetExportDropdown component.
- **Vercel Analytics** integrated in the root layout for deployment observability.
- **Updated project documentation.** AGENTS.md and README.md were refreshed to document all new features including the Asset Library, Preset Compare, and Search/Filtering capabilities.

---

## [v1.0.0] — July 12, 2026

Initial release of PromptLab.

### Core Engine

- Dynamic template system with auto-generated form fields from `{{ placeholder_variables }}` in the prompt template.
- Real-time text streaming via Server-Sent Events (SSE) with client-side chunk buffer reassembly for reliable parsing.
- Reasoning trace separation — for models supporting thinking/reasoning, the engine's internal thought process is displayed in a dedicated console alongside the main generation output.
- Strict plain-text output formatting with zero Markdown symbols, producing clean, readable scripts.
- Server-side Gemini API proxy (`/app/api/generate/route.ts`) — the API key never touches the client.

### Image Handling

- Drag-and-drop image uploads with `@imageN` casting annotations mapped to character or setting labels.
- Automatic JPEG compression (90% quality) via HTML Canvas, with white background fill for PNG transparency handling.
- IndexedDB image storage (`promptlab_db`) avoiding browser localStorage quota limits (5–10MB vs hundreds of MB).
- Metadata separation — only image metadata stored in localStorage; raw Base64 blobs stored exclusively in IndexedDB.
- Images smaller than ~40KB bypass the compression pipeline automatically.

### Presets & Configuration

- Three built-in presets: AI Casting & Screenplay, AI Director & Storyboard, and VFX & Speculative Worldbuilder.
- Custom preset CRUD — save, load, and delete user presets via localStorage, managed independently from filesystem presets.
- JSON import and export for presets.
- URL preset import via query parameters (`?presetUrl=`, `?configUrl=`, `?preset=`, or `?config=`) with automatic GitHub blob-to-raw URL conversion and an import confirmation modal.

### Engine Controls

- Model selection (default: Gemini 3.5 Flash, with 3.1 Flash Lite and 3.1 Pro options).
- Temperature control (0.0 to 2.0, default 1.0).
- Reasoning effort levels: MINIMAL, LOW, MEDIUM (default), and HIGH.
- Custom API key override stored in localStorage and securely proxied server-side.
- Max output token threshold.
- Workspace footer shows active engine, reasoning level, and temperature.

### Session Management

- Input persistence in localStorage — template variables, prompts, and engine settings survive page refreshes.
- Collapsible history panel with past generation recall — clicking a history card restores the full workspace state including templates, variables, and image references (loaded from IndexedDB).
- Clear session with confirmation dialog.
- Collapsible Lab Manual quick-start guide with 4-step walkthrough, persisted open/closed state.
- Collapsible sections in the Configure Prompts modal (System Presets, Custom Presets, Lab Manual) with persisted state.

### UI/UX

- Escape key closes modal dialogs.
- Custom branding — logo, favicon, and app icons across all platforms.
- Responsive layout with dedicated input sidebar and output panel.
- Analog Brutalist Retro Lab aesthetic with Inter, JetBrains Mono, and serif typography.