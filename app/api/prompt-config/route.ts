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
    const presets: Array<{ id: string; name: string; systemPrompt: string; promptTemplate: string; createdAt?: string; updatedAt?: string }> = [];
    const presetsDir = path.join(process.cwd(), "prompts", "presets");
    try {
      const entries = await fs.readdir(presetsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderPath = path.join(presetsDir, entry.name);
          try {
            let meta: { name?: string; createdAt?: string; updatedAt?: string } = {};
            try {
              const metaContent = await fs.readFile(path.join(folderPath, "meta.json"), "utf-8");
              meta = JSON.parse(metaContent);
            } catch (e) {
              // meta.json missing or invalid
            }

            let sysPrompt = "";
            try {
              sysPrompt = await fs.readFile(path.join(folderPath, "system_prompt.txt"), "utf-8");
            } catch (e) {
              // system_prompt.txt missing
            }

            let prmTemplate = "";
            try {
              prmTemplate = await fs.readFile(path.join(folderPath, "prompt_template.txt"), "utf-8");
            } catch (e) {
              // prompt_template.txt missing
            }

            presets.push({
              id: entry.name,
              name: meta.name || entry.name,
              systemPrompt: sysPrompt,
              promptTemplate: prmTemplate,
              createdAt: meta.createdAt,
              updatedAt: meta.updatedAt,
            });
          } catch (e) {
            console.error(`Failed to load preset directory ${entry.name}:`, e);
          }
        } else if (entry.isFile() && entry.name.endsWith(".json")) {
          const content = await fs.readFile(path.join(presetsDir, entry.name), "utf-8");
          try {
            const parsed = JSON.parse(content);
            if (parsed.name && parsed.systemPrompt && parsed.promptTemplate) {
              presets.push({
                id: entry.name.replace(".json", ""),
                name: parsed.name,
                systemPrompt: parsed.systemPrompt,
                promptTemplate: parsed.promptTemplate,
                createdAt: parsed.createdAt,
                updatedAt: parsed.updatedAt,
              });
            }
          } catch (e) {
            console.error(`Failed to parse preset file ${entry.name}:`, e);
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
