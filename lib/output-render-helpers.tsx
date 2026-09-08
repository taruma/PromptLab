import React from "react";
import type { Components } from "react-markdown";

export type OutputViewMode = "formatted" | "raw" | "json" | "auteur";

/**
 * Extracts and parses JSON from raw or markdown-fenced text.
 */
export function extractCleanJson(raw: string): { parsed: any | null; formatted: string; isValid: boolean } {
  if (!raw || !raw.trim()) {
    return { parsed: null, formatted: "", isValid: false };
  }

  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(text);
    return {
      parsed,
      formatted: JSON.stringify(parsed, null, 2),
      isValid: true,
    };
  } catch {
    return {
      parsed: null,
      formatted: text,
      isValid: false,
    };
  }
}

/**
 * Tokenizes a single line of JSON and returns syntax-highlighted React nodes.
 */
export function highlightJsonLine(line: string, lineIndex: number): React.ReactNode[] {
  // Matches:
  // 1. Property key (string with colon): "key":
  // 2. String literal: "..."
  // 3. Booleans: true / false
  // 4. Null: null
  // 5. Numbers: integers, decimals, negatives, exponentials
  // 6. Structural delimiters & punctuation: { } [ ] , :
  const regex = /("(?:\\[\s\S]|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:])/g;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `tok-${lineIndex}-${match.index}`;

    if (token.endsWith(":")) {
      const colonIdx = token.lastIndexOf(":");
      const keyText = token.slice(0, colonIdx);
      const colonText = token.slice(colonIdx);
      result.push(
        <span key={key} className="text-[#1A1A1A] font-semibold">
          {keyText}
        </span>
      );
      result.push(
        <span key={`${key}-col`} className="text-[#888884]">
          {colonText}
        </span>
      );
    } else if (token.startsWith('"')) {
      result.push(
        <span key={key} className="text-teal-800 font-normal">
          {token}
        </span>
      );
    } else if (token === "true" || token === "false") {
      result.push(
        <span key={key} className="text-indigo-800 font-medium">
          {token}
        </span>
      );
    } else if (token === "null") {
      result.push(
        <span key={key} className="text-stone-500 italic">
          {token}
        </span>
      );
    } else if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) {
      result.push(
        <span key={key} className="text-amber-800 font-medium">
          {token}
        </span>
      );
    } else if (/[{}[\],:]/.test(token)) {
      result.push(
        <span key={key} className="text-[#78716C]">
          {token}
        </span>
      );
    } else {
      result.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    result.push(line.slice(lastIndex));
  }

  return result;
}

/**
 * Standardized PromptLab Analog Brutalist Markdown styling configuration
 * for react-markdown.
 */
export const outputMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-black uppercase tracking-wider my-3 pb-1 border-b border-[#D1D1CF] font-sans text-[#1A1A1A]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold uppercase tracking-wider my-2.5 font-sans text-[#1A1A1A]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-bold uppercase tracking-wider my-2 font-sans text-[#1A1A1A]">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[11px] font-bold uppercase tracking-wider my-1.5 font-sans text-[#1A1A1A]">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-[#1A1A1A] font-serif text-sm">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-3 space-y-1 text-[#1A1A1A] font-serif text-sm pl-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1 text-[#1A1A1A] font-serif text-sm pl-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed font-serif text-sm inline-block w-full">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#1A1A1A] pl-3 my-3 italic text-stone-700 font-serif bg-[#F4F4F2] py-2 pr-2 text-sm">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <pre className="bg-[#F4F4F2] border border-[#D1D1CF] p-3 my-3 font-mono text-xs overflow-x-auto text-[#1A1A1A] whitespace-pre">
        <code>{children}</code>
      </pre>
    ) : (
      <code
        className="bg-[#F4F4F2] border border-[#D1D1CF] px-1.5 py-0.5 font-mono text-[11px] text-[#1A1A1A]"
        {...props}
      >
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-3 border-[#D1D1CF]" />,
  strong: ({ children }) => (
    <strong className="font-bold text-[#1A1A1A] font-sans">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic font-serif">{children}</em>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 border border-[#D1D1CF]">
      <table className="min-w-full divide-y divide-[#D1D1CF] text-xs font-mono">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-[#F4F4F2] px-2.5 py-1.5 text-left font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#D1D1CF]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-2.5 py-1.5 border-b border-[#EAEAE8] text-[#1A1A1A]">
      {children}
    </td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal-800 hover:text-teal-950 underline font-medium"
    >
      {children}
    </a>
  ),
};
