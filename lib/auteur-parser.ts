/**
 * lib/auteur-parser.ts
 *
 * Lightweight parser and syntax analyzer for Auteur Scripts.
 * Directs cinematic AI prompting by separating invariant pre-production
 * Staging context from kinetic Timeline execution macro-states.
 */

export interface AuteurStagingBlock {
  name: string;
  lines: string[];
  rawContent: string;
}

export interface AuteurMacroState {
  rawLine: string;
  leadAction: string;
  subStates: string[];
  // Backwards compatibility aliases
  leadStep?: string;
  waterfallSteps?: string[];
}

// Backwards-compatible type alias
export type AuteurExecutionBeat = AuteurMacroState;

export interface AuteurParsedScript {
  title?: string;
  stagingBlocks: AuteurStagingBlock[];
  macroStates: AuteurMacroState[];
  // Backwards-compatible alias
  executionBeats: AuteurMacroState[];
  aestheticTokens: string[];
  characterNames: string[];
  isAuteur: boolean;
}

const STOP_WORDS = new Set([
  "BOTH",
  "ALL",
  "THE",
  "AND",
  "WITH",
  "FOR",
  "FROM",
  "INTO",
  "UNDER",
  "NEAR",
  "SCENE",
  "PART",
  "OVER",
  "DOWN",
  "UPON",
]);

/**
 * Ultra-fast O(N) check to determine if text follows the Auteur Script framework.
 * Completely flexible to any custom macro-block names ([CONTINUITY PROTOCOL], [REFERENCES], etc.)
 */
export function isAuteurScript(text: string): boolean {
  if (!text || text.length < 30) return false;

  // Check for execution/timeline phase boundary
  const hasExecution = /(?:^|\n)\s*\[(?:EXECUTION|TIMELINE)\]/i.test(text);
  if (!hasExecution) return false;

  // Check for any staging/macro block header prior to execution, or camera coordinate
  const hasMacroBlock = /(?:^|\n)\s*\[[A-Za-z0-9 _%-]{2,}\]/i.test(text);
  return hasMacroBlock;
}

/**
 * Splits line by `->` or `→` into sequential sub-states
 */
export function splitSteps(line: string): string[] {
  if (!line) return [];
  const normalized = line.replace(/→/g, "->");
  return normalized
    .split(/\s*->\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extracts aesthetic / coordinate mapping tokens (e.g. `-> LOC01`, `-> WAR_ROB01`, `-> DIN01`)
 * Scans across all staging blocks (AESTHETIC, LOOKBOOK, CONTINUITY, etc.) for maximum flexibility.
 */
export function extractAestheticTokens(stagingBlocks: AuteurStagingBlock[]): string[] {
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const sb of stagingBlocks) {
    for (const line of sb.lines) {
      // Matches `-> TOKEN` or `→ TOKEN`
      const regex = /(?:->|→)\s*([A-Za-z0-9_-]+)/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        const tok = match[1];
        if (tok && !seen.has(tok) && !STOP_WORDS.has(tok.toUpperCase())) {
          seen.add(tok);
          tokens.push(tok);
        }
      }
    }
  }

  // Sort descending by length to avoid partial prefix collisions during highlighting
  return tokens.sort((a, b) => b.length - a.length);
}

/**
 * Extracts declared character names (e.g. `@actor1 as Arthur`, `@image1 as Robert`)
 * Scans across all staging blocks flexibly.
 */
export function extractCharacterNames(stagingBlocks: AuteurStagingBlock[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  const addName = (raw: string) => {
    if (!raw) return;
    const clean = raw.trim();
    if (clean.length >= 2 && !STOP_WORDS.has(clean.toUpperCase())) {
      const upper = clean.toUpperCase();
      const title = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();

      if (!seen.has(upper)) {
        seen.add(upper);
        names.push(upper);
      }
      if (!seen.has(title)) {
        seen.add(title);
        names.push(title);
      }
    }
  };

  for (const sb of stagingBlocks) {
    for (const line of sb.lines) {
      // Matches `@ref as Name` or `@ref as [Name]`
      const regex = /@[A-Za-z0-9_-]+\s+as\s+([A-Za-z0-9_-]+)/gi;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        addName(match[1]);
      }
    }
  }

  return names.sort((a, b) => b.length - a.length);
}

/**
 * Parses raw text into Auteur Script Staging blocks and Execution macro-states.
 */
export function parseAuteurScript(rawText: string): AuteurParsedScript {
  if (!rawText) {
    return {
      stagingBlocks: [],
      macroStates: [],
      executionBeats: [],
      aestheticTokens: [],
      characterNames: [],
      isAuteur: false,
    };
  }

  let text = rawText.trim();
  let title: string | undefined = undefined;

  // Extract optional markdown code block title (e.g. ```{.auteur title="PREHISTORIC SURVIVAL CHASE"})
  const codeBlockMatch = text.match(/^```(?:\{\.auteur(?:\s+title="([^"]+)")?\}|auteur(?:\s+title="([^"]+)")?)/i);
  if (codeBlockMatch) {
    title = codeBlockMatch[1] || codeBlockMatch[2];
    text = text.replace(/^```[^\n]*\n/, "").replace(/\n```$/, "").trim();
  }

  // Also check for markdown header title at top (e.g. # TITLE or ## TITLE) if no code block title
  if (!title) {
    const titleMatch = text.match(/^(?:#{1,3}\s+TITLE:\s*([^\n]+)|#{1,3}\s+([^\n]+))\n/i);
    if (titleMatch) {
      title = (titleMatch[1] || titleMatch[2]).trim();
      text = text.replace(/^(?:#{1,3}\s+TITLE:\s*[^\n]+|#{1,3}\s+[^\n]+)\n/i, "").trim();
    }
  }

  const lines = text.split(/\r?\n/);
  const stagingBlocks: AuteurStagingBlock[] = [];
  const macroStates: AuteurMacroState[] = [];

  let inExecution = false;
  let currentBlock: AuteurStagingBlock | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inExecution) {
      // Check for macro-block header: [BLOCK_NAME] (e.g. [INTENT], [CONTINUITY PROTOCOL], [REFERENCES], etc.)
      const blockHeaderMatch = trimmed.match(/^\[([A-Z0-9 _%-]+)\]$/i);
      if (blockHeaderMatch) {
        const blockName = blockHeaderMatch[1].trim().toUpperCase();
        if (blockName === "EXECUTION" || blockName === "TIMELINE") {
          inExecution = true;
          currentBlock = null;
        } else {
          currentBlock = {
            name: blockName,
            lines: [],
            rawContent: "",
          };
          stagingBlocks.push(currentBlock);
        }
      } else if (currentBlock) {
        if (trimmed !== "" || currentBlock.lines.length > 0) {
          currentBlock.lines.push(line);
        }
      }
    } else {
      // In execution phase: every non-empty line is a macro-state
      if (trimmed !== "") {
        const subStates = splitSteps(trimmed);
        const lead = subStates[0] || trimmed;
        const rest = subStates.slice(1);
        macroStates.push({
          rawLine: trimmed,
          leadAction: lead,
          subStates: rest,
          // Aliases for compatibility
          leadStep: lead,
          waterfallSteps: rest,
        });
      }
    }
  }

  // Finalize rawContent on staging blocks
  for (const sb of stagingBlocks) {
    sb.rawContent = sb.lines.join("\n").trim();
  }

  const aestheticTokens = extractAestheticTokens(stagingBlocks);
  const characterNames = extractCharacterNames(stagingBlocks);

  const isAuteur = inExecution && macroStates.length > 0;

  return {
    title,
    stagingBlocks,
    macroStates,
    executionBeats: macroStates,
    aestheticTokens,
    characterNames,
    isAuteur,
  };
}
