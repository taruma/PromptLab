## v2.4.1: Teach, Don't Preach

**PromptLab v2.4.1** is a focused patch that strips all AI-centric and prompt-generation language from the 10 built-in system presets, refocusing them as pure educational and analytical tools for understanding filmmaking craft. Every preset now teaches cinematic language, composition, color theory, camera movement, shot breakdown, style definition, or narrative treatment — without prescribing output formats or spitting out copy-paste prompts for generators.

---

### ✨ Highlights

#### 📚 Presets Refocused on Education, Not Prompt Generation

All 10 built-in presets were refactored to serve as **tool-agnostic teaching references**. The goal: users learn to see, describe, and think about visual media with the fluency of a filmmaker — regardless of what tools they use downstream.

**What was removed:**

- Dedicated output sections that produced AI prompt fragments, generation tokens, style bibles, video prompt keywords, and copy-paste-ready generator inputs
- Intro paragraphs that framed presets as prompt factories for "AI image/video generators"
- Final instruction lines in prompt templates that directed output toward "generation prompts" or "generative tools"

**What remains — and is now the focus:**

- Deep multi-dimensional analysis of cinematic language
- Structured breakdowns of color palettes, composition geometry, camera movement, shot sequences, and genre conventions
- Glossaries of technical terminology with plain-English definitions
- Creative variations, re-imaginings, and directing insights
- Educational craft notes on treatment writing and visual communication

**Design philosophy:** Users who want to convert their analysis into prompts can pair an educational preset (e.g., Cine DeepDive for analysis) with another tool or preset designed for prompt construction. The presets themselves stay focused on what they do best: teaching the craft.

---

### ✨ What's New

- 🧹 **Stripped prompt-generation sections from all 10 system presets** — removed "GENERATION TOOLKIT," "PROMPT FRAGMENTS," "STYLE BIBLE," "VIDEO MOTION TOKENS," and similar output sections from every `system_prompt.txt`
- ✏️ **Rephrased intro paragraphs** — 6 intro passages across 5 presets now emphasize teaching, description, and visual literacy instead of prompt construction
- 📝 **Cleaned prompt template instructions** — 5 `prompt_template.txt` files had their final instruction lines simplified to focus on analysis and explanation

### 🔄 Changed

- **cine_deepdive** — Removed GENERATION TOOLKIT section (prompt fragments + style tokens); renumbered §6 → §5
- **color_mapper** — Removed GENERATION COLOR TOKENS section (palette keywords, negative tokens); renumbered §8 → §7; cleaned prompt template final line
- **comp_decoder** — Removed PROMPT COMPOSITION TOKENS section; rephrased intro from "writing AI image/video prompts" to "communicating visual ideas effectively"; renumbered §6 → §5
- **film_lingo** — Removed PROMPT FRAGMENTS section (Midjourney, DALL-E, Runway, Sora references); cleaned prompt template final line
- **genre_lexicon** — Removed GENERATION TOOLKIT section; rephrased intro from "AI image/video generation" to "digital creation"; renumbered §6 → §5; cleaned prompt template final line
- **motion_lab** — Removed VIDEO MOTION TOKENS section; rephrased intro from "writing AI video generation prompts" to "communicating camera direction with precise motion descriptors"; renumbered §6→§5, §7→§6
- **scene_lab** — Removed GENERATION EXTRACTS section; renumbered §6 → §5
- **shot_interp** — Removed VIDEO PROMPT FRAGMENTS section; rephrased intro from "writing prompts for AI video generators" to "writing precise shot descriptions"; renumbered §6 → §5
- **style_architect** — Removed STYLE BIBLE section; rephrased intro from "working with AI image/video generators" and "handed directly to an AI generator" to "briefing collaborators... building a reference library" and "a definitive creative reference"; renumbered §7→§6, §8→§7; cleaned prompt template final line
- **vis_narrative** — Removed GENERATION PROMPTS section; cleaned prompt template final line

### 📁 Files Affected

15 files across all 10 preset folders:

- 10 `system_prompt.txt` files — sections removed + intros rephrased
- 5 `prompt_template.txt` files — final instruction lines cleaned (color_mapper, film_lingo, genre_lexicon, style_architect, vis_narrative)