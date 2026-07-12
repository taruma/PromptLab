<div align="center">
<img src="public/logo_promptlab.png" alt="PromptLab Logo" width="120" height="120" />

# PromptLab

**[promptlab.taruma.my.id](https://promptlab.taruma.my.id)**

*A playground for drafting and iterating on AI prompt templates — experiment, test, and refine before taking your prompts to production.*

</div>

---

## What is PromptLab?

PromptLab is a **first-draft playground** for prompt engineering. Write your system instructions and prompt templates with `{{ dynamic_variables }}`, upload reference images, and quickly test your prompts against **Google Gemini**. It's not a production pipeline — it's where you sketch, iterate, and nail down your prompt design before using it elsewhere.

---

## Features

- **Dynamic Template Variables** — Add `{{ placeholders }}` to your prompt template and form fields appear automatically. No hardcoding needed.
- **Visual Reference Uploads** — Drag and drop images to serve as casting or scene references. Each asset is auto-mapped (e.g., `@image1`) and injected into your prompt.
- **Custom Presets** — Save your own system instructions and templates. Import and export them as JSON files.
- **Engine Controls** — Switch between Gemini models (3.5 Flash, 3.1 Flash Lite, 3.1 Pro), adjust temperature, reasoning effort, and max output tokens.
- **Custom API Key** — Bring your own Gemini API key to use personal quotas or premium models.
- **Session History** — Past generations are saved locally in your browser for easy recall.

---

## Built-in Presets

| Preset | Focus |
|--------|-------|
| **AI Casting & Screenplay** | Character-driven dramatic narratives. Generates synthetic persona breakdowns, scene beats, cinematic dialogue drafts, and performance directives. |
| **AI Director & Storyboard** | Cinematic pre-production. Produces directorial vision, camera/lens specs, shot-by-shot AI storyboard plans, and soundscape design. |
| **VFX & Speculative Worldbuilder** | Virtual production & world design. Delivers environmental constitutions, LED volume schematics, VFX complexity passes, and text-to-3D asset prompts. |

> **These presets are examples only.** PromptLab is designed for you to bring your own system instructions and prompt templates — edit freely or start from scratch via the **Configure Prompts** panel.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A [Google Gemini API key](https://aistudio.google.com/apikey)

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/taruma/PromptX.git
cd PromptX
npm install
```

### 2. Set Your API Key

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
```

You can also provide a key later through the **Engine Controls** panel in the app — it will be stored locally in your browser.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Bring your own system instructions and template** via the **Configure Prompts** button — or start from one of the example presets
2. **Fill in the template variables** that appear in the left panel
3. **Upload reference images** by dragging them into the drop zone — label each one to map it to a character or setting
4. **Click "Generate Sequence"** to test your prompt against Gemini
5. **Review the output**, tweak your template, and generate again — iterate until your prompt design feels right
6. **Browse past generations** in the history panel; click any entry to restore it

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No* | Your Gemini API key. *Not required if you provide a custom key in the app's Engine Controls panel. |

---

## Tech Stack

Built with [Next.js](https://nextjs.org/) 15, [Tailwind CSS](https://tailwindcss.com/) v4, [TypeScript](https://www.typescriptlang.org/), and the [Google GenAI SDK](https://www.npmjs.com/package/@google/genai).

---

## Disclaimer

This project was created through vibe coding using [AI Studio](https://ai.studio) with Gemini 3.5 Flash. Use at your own risk — feel free to inspect and modify the source code as you see fit.

---

## License

MIT © [Taruma Sakti](https://github.com/taruma)
