# Modal, Overlay & Keyboard Event Architecture Rule

This document defines the mandatory architectural conventions, event propagation rules, and stacking context tiers for creating, nesting, and refactoring modals, dialogs, popovers, and overlays in PromptLab.

---

## 1. The 3-Tier Event Dispatch Hierarchy

When multiple interactive layers (fullscreen modals, sub-dialogs, dropdown menus, popovers, and text inputs) coexist, <kbd>Escape</kbd> key dismissals must follow a strict **inverted priority model**. Sub-overlays and inputs must consume the event first; only unconsumed events should bubble up to parent dialogs.

```
┌────────────────────────────────────────────────────────────────────────┐
│ DOM Event Dispatch Path for Escape                                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Document Capture Phase:                                             │
│    Active Dropdown Menus & Popovers (Tier 4)                           │
│    → e.preventDefault(), e.stopPropagation(),                          │
│      e.stopImmediatePropagation()                                      │
│    → Closes ONLY the menu/popover. Never reaches window.               │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Target / Element Phase:                                             │
│    Active Input Fields (Search, Inline Renaming)                       │
│    → e.nativeEvent.stopImmediatePropagation()                          │
│    → Clears query or cancels edit. Never reaches window.               │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Window Bubble Phase:                                                │
│    Global Modal Stack Coordinator (useModalEscape)                     │
│    → Pops and executes strictly the topmost modal handler              │
│    → Closes ONLY the topmost modal/dialog.                             │
└────────────────────────────────────────────────────────────────────────┘
```

### The Window Capture-Phase Anti-Pattern (STRICTLY PROHIBITED)
- **NEVER** attach global modal escape listeners to `window` with `{ capture: true }` (or `window.addEventListener("keydown", fn, true)`).
- **Why**: Because the browser executes `window` capture listeners before any DOM element or document listener. A capture listener on `window` kills the event for all children, causing the parent modal to close whenever a user attempts to dismiss a local dropdown, close a popover, or clear an input.
- **Rule**: The global modal stack (`use-modal-stack.ts`) must **always** listen in the standard **bubbling phase** (`false`).

### Sub-Overlay Capture Rule
- Transient popovers (e.g., token cost breakdown) and dropdown menus (e.g., Export JSON) rendered within a modal must attach their <kbd>Escape</kbd> listener to `document` in the **capture phase** (`true`):
  ```typescript
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      onClose();
    }
  };
  document.addEventListener("keydown", handleKeyDown, true);
  ```

### Input Field Isolation Rule
- Any `<input>` or `<textarea>` that uses <kbd>Escape</kbd> (e.g., clearing search or canceling inline renaming) must stop the native browser event:
  ```typescript
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    cancelAction();
  }
  ```

---

## 2. Standardized 5-Tier Z-Index Stacking Context Scale

Never use arbitrary magic numbers (`z-[99]`, `z-[100]`, `z-[999]`) for overlays. Adhere strictly to the 5-tier system:

| Tier | Tailwind Class | Usage / Element Types | Examples |
| :--- | :--- | :--- | :--- |
| **Tier 1** | `z-10` | Canvas layout, status tags, floating badges | Asset status tags, card action overlays |
| **Tier 2** | `z-50` | Primary fullscreen modals & side drawers | `HistoryViewerModal`, `PromptConfigModal`, `ProjectManagerModal`, `AssetLibrarySidebar` |
| **Tier 3** | `z-[60]` | Sub-modals, nested dialogs & confirmations | `VideoPlayerModal` (from history), `DeleteHistoryConfirmModal`, `LoadWorkspaceConfirmModal`, `PresetCompareModal` |
| **Tier 4** | `z-[70]` | Floating popovers & action dropdown menus | `HistoryCostPopover`, Export JSON dropdown, Quick Selector menus |
| **Tier 5** | `z-[80]` | Portaled hover previews & floating tooltips | `HistoryImageCardWithHover` portal, help tooltips |

---

## 3. The 4-Phase Decomposition Protocol for Monolithic Modals

When refactoring or building large modal components (1,000+ lines), follow this strict dependency-ordered sequence:

1. **Phase 1: Canonical Types**:
   - Extract domain interfaces into a dedicated file in `/types/` (e.g., `types/history.ts`).
   - Eliminate duplicated interfaces across caller files before modifying components.
2. **Phase 2: Event & Keyboard Contract**:
   - Wire all dialog surfaces into `useModalEscape(isOpen, onClose)`.
   - Verify that nested child dialogs do not trigger double-closes.
3. **Phase 3: Stacking Context Tiers**:
   - Map every UI layer to the 5-Tier Z-Index scale.
4. **Phase 4: Component Decomposition**:
   - Separate sidebar/navigation, detail panels, action popovers, and cards into focused subcomponents in a dedicated feature folder (e.g., `components/history/`).
   - Maintain a slim orchestrator modal (under 400 lines) that coordinates data flow.

---

## 4. Manual Verification Checklist for Overlays

Because static type checks (`tsc`) and Next.js production builds cannot detect DOM event propagation ordering bugs, the following manual test flow is **mandatory** whenever modal or overlay code is modified:

- [ ] **Sub-Overlay Isolation**: Open a dropdown or popover inside the modal. Press <kbd>Escape</kbd>. Verify *only* the dropdown/popover closes; the parent modal must stay open.
- [ ] **Input Isolation**: Focus an inline edit or search input with text. Press <kbd>Escape</kbd>. Verify the query clears or edit cancels; the modal must stay open.
- [ ] **Child Modal Isolation**: Open a nested player or confirm dialog (Tier 3). Press <kbd>Escape</kbd>. Verify *only* the child modal closes; the parent modal must stay open.
- [ ] **Parent Dismissal**: With no sub-overlays or child modals active, press <kbd>Escape</kbd>. Verify the parent modal closes cleanly.
- [ ] **Background Scroll Lock**: Verify that `document.body.style.overflow = "hidden"` is active when any modal is open, and restored to empty when all modals are dismissed.
