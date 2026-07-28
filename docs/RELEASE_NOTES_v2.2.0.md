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
