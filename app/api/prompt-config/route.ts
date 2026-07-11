import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const systemPromptPath = path.join(process.cwd(), "prompts", "system_prompt.txt");
    const promptTemplatePath = path.join(process.cwd(), "prompts", "prompt_template.txt");

    const systemPrompt = await fs.readFile(systemPromptPath, "utf-8");
    const promptTemplate = await fs.readFile(promptTemplatePath, "utf-8");

    // Extract placeholders: e.g. {{ genre }}
    const matches = Array.from(promptTemplate.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g));
    const variables = new Set<string>();
    for (const match of matches) {
      variables.add(match[1]);
    }

    // Load available presets
    const presets: Array<{ id: string; name: string; systemPrompt: string; promptTemplate: string }> = [];
    const presetsDir = path.join(process.cwd(), "prompts", "presets");
    try {
      const files = await fs.readdir(presetsDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(path.join(presetsDir, file), "utf-8");
          try {
            const parsed = JSON.parse(content);
            if (parsed.name && parsed.systemPrompt && parsed.promptTemplate) {
              presets.push({
                id: file.replace(".json", ""),
                name: parsed.name,
                systemPrompt: parsed.systemPrompt,
                promptTemplate: parsed.promptTemplate,
              });
            }
          } catch (e) {
            console.error(`Failed to parse preset file ${file}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn("Presets folder is empty or not accessible", e);
    }

    return NextResponse.json({
      systemPrompt,
      promptTemplate,
      variables: Array.from(variables),
      presets,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
