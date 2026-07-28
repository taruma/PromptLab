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
