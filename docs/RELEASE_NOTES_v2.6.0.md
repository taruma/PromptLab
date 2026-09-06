## v2.6.0: Filter. Focus. Accelerate.

**PromptLab v2.6.0** delivers a major upgrade to sequence inspection, generation history discovery, and workspace workflow ergonomics. This release decomposes the monolithic history viewer into a modular, high-craft architecture featuring a **Modular Output & Reasoning Viewer** with RAW Monospace default rendering, an expandable **Thinking Trace Accordion**, and a distraction-free **Fullscreen Focus Modal**. For sequence exploration, an overhauled **Sidebar Filtering & Grouping Engine** introduces multi-select media filters with strict AND matching, dynamic preset and model extractors, contextual date bucketing (`TODAY`, `YESTERDAY`, `PREVIOUS 7 DAYS`, `OLDER`), and a 2-button **View Density Switcher** (Detailed vs Compact). In the active workspace, creators can now seamlessly paste images directly from their OS clipboard with **`Ctrl+V` / `Cmd+V`**, trigger synthesis via **`Ctrl+Enter` / `Cmd+Enter`**, and dismiss layered dialogs predictably via a centralized **Universal LIFO Modal Escape Stack** (`useModalEscape`) backed by a standardized 5-tier z-index scale.

---

### ✨ Highlights

#### 🗂️ History Preview Panel Redesign & Modular Output Viewer

Generation output inspection in the Session History Explorer has been completely re-architected into modular, reusable subcomponents adhering strictly to Analog Brutalist Retro Lab ergonomics:

- 📜 **Modular Output Viewer (`HistoryOutputViewer.tsx`)** — isolated subcomponent supporting 3-mode rendering defaulting strictly to **RAW Monospace** on every modal open and slot change. Includes one-click toggles to **Formatted Markdown (`MD`)** (with custom-styled typography, blockquotes, and code fences) and **Syntax-Highlighted JSON (`JSON`)** (with line numbers, per-token syntax colors, and line counts). Includes live character and word counters in the header.
- 🧠 **Collapsible Reasoning / Thinking Trace Accordion** — automatically surfaces an expandable amber/slate accordion when thought tokens (`thinkingResult`) are recorded, displaying parsed thought markdown alongside a `{count} thought tokens` metric badge.
- 🔍 **Distraction-Free Fullscreen Focus Modal (`HistoryFullscreenOutputModal.tsx`)** — full-viewport reading overlay (Tier 3 `z-[60]`) for inspecting deep narrative responses or complex JSON schemas, coordinated with the universal Escape stack.
- ✏️ **Inline Sequence Title Renaming** — an edit pencil trigger (`Edit3`) beside the sequence title enables inline renaming with <kbd>Enter</kbd> to save, <kbd>Escape</kbd> to cancel, and touch-friendly check/cancel action controls.
- 🎛️ **Unified Color-Coded Metadata Ribbon** — replaced disconnected engine labels with a pixel-aligned, color-categorized ribbon (`h-5`, `text-[9px]` baseline): Blue for Model, Amber for Reasoning, Purple for Preset, Emerald for interactive Cost Popover, and Slate for Tokens. Temperature and Max Tokens appear dynamically only when differing from default values.
- 📋 **Dynamic Parameter Copy Triggers** — individual one-click copy buttons with transient `Copied!` feedback for each dynamic variable value.

---

#### 🔍 History Sidebar Overhaul: Sorting, Filtering & Date Grouping

Finding, auditing, and comparing past prompts is significantly faster and more granular:

- 🗄️ **Collapsible Filter & Sort Drawer** — a compact `[SORT & FILTER ▾]` drawer button houses sorting options, dynamic presets, models, reasoning levels, and media filters while preserving vertical space for the slot list.
- 🏷️ **Multi-Select Media Filters (AND Logic)** — toggle chips (`IMG`, `VID`, `AUD`, `DOC`) support multi-selection with strict AND-matching logic (e.g., selecting `IMG` + `VID` surfaces only generations containing both images and video references).
- 🧩 **Dynamic Presets & Models Extraction** — automatically scans historical records to extract available presets and models with live item counts, alongside a dedicated `Custom (No Preset)` option.
- 📅 **Smart Contextual Date Grouping** — when sorting by Date, slots are sectioned under sticky, collapsible retro-lab headers (`TODAY`, `YESTERDAY`, `PREVIOUS 7 DAYS`, `OLDER`). Sorting by Cost or Name transitions to a continuous flat ranked list with `#N` rank badges.
- 🎚️ **View Density Toggle (Detailed vs Compact)** — a 2-button header switcher toggles between rich 4-row cards (with narrative excerpts and full badge stacks) and streamlined 2-line compact cards (with minimalist color-coded indicator dots: Black for Images, Amber for Videos, Purple for Audio, Teal for Documents). Persisted in `localStorage` (`promptlab_history_density_mode`).
- ⌨️ **Keyboard Arrow Navigation** — <kbd>ArrowUp</kbd> and <kbd>ArrowDown</kbd> hotkeys step through filtered slots with smooth scrolling and input focus protection.

---

#### 🎯 Universal Search & Integrated Side Scope Selector

The history search bar has been enhanced with deep targeting capabilities:

- 🎯 **Integrated Side Scope Selector** — a compact icon-only trigger embedded into the right edge of the search box opens a `w-72` popover with descriptive subtitles and an inline `DEFAULT` badge.
- 🌐 **7 Target Search Areas** — defaults to **All Content (Universal)** (scanning titles, objectives, parameter keys & values, generated outputs, media labels, and compiled prompt specs), with granular targeting for:
  - *Slot Name / Title* (`default`)
  - *Main Objective / Idea* (`idea`)
  - *Generated Output* (`output`)
  - *Media Reference Labels* (`visual_reference`)
  - *Dynamic Parameters* (`parameters`)
  - *Compiled Prompt Specs* (`compiled_prompt`)

---

#### 📋 OS Clipboard Image Paste Support (`Ctrl+V` / `Cmd+V`)

Adding reference images is now as simple as copying a screenshot from anywhere in your OS:

- 📋 **Native Clipboard Listener (`use-clipboard-image-paste.ts`)** — intercepts image paste events anywhere in the active workspace.
- 🗜️ **Automatic Canvas Compression & Deduplication** — compresses pasted images to high-quality JPEG (90% quality), generates a SHA-256 content hash, stores the binary blob in `promptlab_db`, and maps it to the next dynamic `@imageN` casting tag.
- 🏷️ **Smart Sequential Auto-Labeling** — detects generic names (such as `image.png`, `image`, or empty `blob`) and assigns clean labels (`Pasted Image 1`, `Pasted Image 2`, etc.).
- 📂 **Auto-Expansion Feedback** — automatically expands and persists the Visual Assets accordion section when an image is pasted.
- 🛡️ **Zero Text Interference & Modal Safety Gates** — bypasses text and HTML clipboard events to ensure textarea and input typing remain completely uninterrupted, and disables pasting when any modal is open.

---

#### ⚡ Generation Keyboard Shortcut (`Ctrl+Enter` / `Cmd+Enter`)

Trigger sequence synthesis without reaching for the mouse:

- ⌨️ **Cross-Platform Shortcut Hook (`use-generate-shortcut.ts`)** — triggers generation via <kbd>Ctrl+Enter</kbd> (Windows/Linux) or <kbd>Cmd+Enter</kbd> (macOS).
- 🛡️ **Textarea Newline Suppression** — intercepts and suppresses accidental newline insertions inside multiline textareas (**Main Objective / Idea**).
- 🔒 **Execution Gates** — disabled when generation is currently processing (`isLoading`) or when any modal overlay is active.
- 🏷️ **Analog Brutalist Affordance** — subtle `<kbd>Ctrl+↵</kbd>` badge on the "Generate Sequence" button with descriptive tooltip.

---

#### 🛡️ Universal LIFO Modal Escape Stack & 5-Tier Z-Index Architecture

Coordinating nested modals, drawers, and popovers is now completely deterministic:

- 📚 **LIFO Modal Escape Coordinator (`use-modal-stack.ts`)** — global Last-In, First-Out stack array ensuring pressing <kbd>Escape</kbd> pops and dismisses strictly the topmost active dialog without triggering parent closures.
- 📐 **5-Tier Z-Index Scale**:
  - **Tier 1 Canvas** (`z-10`): Floating tags, card actions, asset badges.
  - **Tier 2 Primary Modals** (`z-50`): `HistoryViewerModal`, `PromptConfigModal`, `ProjectManagerModal`, `AssetLibrarySidebar`, `EngineControlsModal`.
  - **Tier 3 Sub-Modals & Confirmations** (`z-[60]`): `HistoryFullscreenOutputModal`, `VideoPlayerModal`, `DeleteHistoryConfirmModal`, `ClearHistoryConfirmModal`, `LoadWorkspaceConfirmModal`, `PresetCompareModal`, `DiscardChangesConfirmModal`.
  - **Tier 4 Floating Popovers** (`z-[70]`): `HistoryCostPopover`, Export dropdowns, Quick Selector menus.
  - **Tier 5 Portaled Hover Previews** (`z-[80]`): `HistoryImageCardWithHover` hover preview with SHA-256 hash badge.
- 🎯 **Capture-Phase Sub-Overlay Prioritization** — popovers and menus capture <kbd>Escape</kbd> on `document` to dismiss without bubbling up to the window modal stack.
- 🔒 **Input Propagation Halts** — search filter inputs and inline title renaming intercept <kbd>Escape</kbd> to clear text or cancel edits without closing parent modals.

---

#### 💰 Click-to-Toggle Itemized Cost Breakdown Popover

- 🖱️ **Intentional Click Interaction** — converted hover-triggered cost breakdown to an intentional click toggle in `GenerationResultView.tsx`, eliminating accidental popover flashing.
- 📜 **Historical Model Rate Isolation** — `HistoryCostPopover` in history inspection computes line-by-line token expenditures strictly using each historical record's archived model specifications (`selectedItem.model`), never leaking active workspace engine settings.
- 📐 **Boundary-Aware Alignment** — dynamically measures container clearance against scrollable containers (`.overflow-y-auto`) on open to prevent right-edge clipping by the vertical scrollbar.

---

### ✨ What's New

- 🗂️ **Modular History Architecture** — extracted monolithic 1,344-line `HistoryViewerModal.tsx` into clean subcomponents: `HistoryListSidebar.tsx`, `HistoryDetailPanel.tsx`, `HistoryCostPopover.tsx`, `HistoryImageCardWithHover.tsx`, `HistoryOutputViewer.tsx`, and `HistoryFullscreenOutputModal.tsx`.
- 📐 **Canonical History Type System (`types/history.ts`)** — centralized single source of truth for `HistoryItem`, `HistoryImage`, `HistoryVideo`, `HistoryTokenUsage`, `HistorySearchScope`, and `HistoryExportResult`.
- 🗄️ **History Grouping Engine (`lib/history-grouping.ts`)** — standalone utility module for date parsing, date bucketing, cost parsing, and multi-criteria filtering.
- 📋 **OS Clipboard Image Paste Hook (`hooks/use-clipboard-image-paste.ts`)** — global image paste listener with canvas compression and deduplication.
- ⚡ **Sequence Generation Shortcut Hook (`hooks/use-generate-shortcut.ts`)** — global <kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd> listener with execution gates.
- 🛡️ **Universal LIFO Escape Stack Hook (`hooks/use-modal-stack.ts`)** — coordinated modal dismissal manager.
- 🔍 **Dynamic Parameters Search Scope** — search specifically for variable placeholder names and customized values.
- 🎚️ **View Density Switcher** — toggle between detailed 4-row cards and streamlined 2-line compact cards with media indicator dots.
- 🏷️ **Dynamic Version Badge** — footer status bar displays dynamic version (`PromptLab v2.6.0 by Taruma Sakti`) sourced directly from `package.json`.

---

### 🔄 Changed

- **Default Output Render Mode**: History Output Viewer now defaults to **RAW Monospace** upon modal open and on every slot switch, providing immediate access to unmodified generation output.
- **Cost Popover Interaction**: Switched from mouse hover to click-to-toggle with outside-click detection, <kbd>Escape</kbd> dismissal, and header close button (<kbd>✕</kbd>).
- **Metadata Ribbon Ergonomics**: Harmonized all metadata badge pills (Model, Reasoning, Preset, Temp, Max, Tokens, Cost) to a unified `h-5` height with matching `text-[9px]` baseline metrics.
- **Adaptive Workspace Dimensions**: Removed rigid min/max height bounds on Main Objective and Dynamic Parameters in the history detail view, allowing natural content flow and maximizing output space.
- **Video Player Stacking**: Elevated `VideoPlayerModal` when launched from History to Tier 3 (`z-[60]`) to stack correctly above `HistoryViewerModal` (`z-50`).

---

### 🐛 Fixed

- **Hierarchical Escape Key Dismissal**: Resolved issue where pressing <kbd>Escape</kbd> failed to close `HistoryViewerModal`, `ProjectManagerModal`, or `StorageUsageModal`.
- **Sub-Overlay Double-Close Bug**: Fixed bug where closing the "Export JSON" dropdown or Cost Breakdown popover inadvertently closed the entire parent `HistoryViewerModal`.
- **Video Player Escape Dismissal**: Fixed latent bug where closing `VideoPlayerModal` via <kbd>Escape</kbd> closed `HistoryViewerModal`.
- **Background Scroll Locking**: Registered all major modals (`isHistoryViewerOpen`, `isProjectManagerOpen`, `isStorageModalOpen`, `isYouTubeModalOpen`, `isFilesApiModalOpen`) in the `isAnyModalOpen` body scroll-lock effect.
- **Project Manager Sub-State Navigation**: Added internal <kbd>Escape</kbd> handlers in `ProjectManagerModal` to cancel project deletion, workspace switching, creation, or renaming before dismissing the modal.

---

### 📁 Files Affected

- `package.json` & `package-lock.json` — version bump to `2.6.0`
- `CHANGELOG.md` — finalized v2.6.0 release entry and metric corrections
- `AGENTS.md` — architectural guidelines (Rules Q, R, S, T, U) and component registry updates
- `types/history.ts` — new canonical history type definitions
- `hooks/use-clipboard-image-paste.ts` — new clipboard paste hook
- `hooks/use-generate-shortcut.ts` — new generation shortcut hook
- `hooks/use-modal-stack.ts` — new universal LIFO modal escape stack hook
- `lib/history-grouping.ts` — new history filtering, date grouping, and sorting engine
- `components/history/HistoryListSidebar.tsx` — new modular history sidebar component
- `components/history/HistoryDetailPanel.tsx` — new modular history detail panel
- `components/history/HistoryOutputViewer.tsx` — new modular output and reasoning viewer
- `components/history/HistoryFullscreenOutputModal.tsx` — new fullscreen reading focus modal
- `components/history/HistoryCostPopover.tsx` — new itemized cost breakdown popover
- `components/history/HistoryImageCardWithHover.tsx` — new hover preview with SHA-256 badge
- `components/HistoryViewerModal.tsx` — refactored into clean orchestrator
- `components/GenerationResultView.tsx` — click-to-toggle cost popover with close button
- `components/VideoPlayerModal.tsx` — elevated to Tier 3 `z-[60]` and wired to `useModalEscape`
- `components/ProjectManagerModal.tsx` — sub-interaction Escape key isolation
- `components/ClearHistoryConfirmModal.tsx` — wired to `useModalEscape`
- `components/DeleteHistoryConfirmModal.tsx` — wired to `useModalEscape`
- `components/LoadWorkspaceConfirmModal.tsx` — wired to `useModalEscape`
- `components/HistoryCardSummary.tsx` — migrated to canonical `types/history.ts`
- `components/HistorySection.tsx` — migrated to canonical `types/history.ts`
- `components/LabManualSection.tsx` — documented `Ctrl+Enter` shortcut in Step 4
- `lib/history-export.ts` — migrated to canonical `types/history.ts`
- `app/page.tsx` — integrated hooks, hierarchical Escape listener, and body scroll lock
- `.agents/rules/modal-overlay-architecture.md` — modal architecture guidelines
- `.agents/skills/cmsg/SKILL.md` — conventional commit skill
