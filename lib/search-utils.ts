/**
 * Normalizes text for search matching by lowercasing and replacing 
 * hyphens, underscores, and punctuation with spaces so "this-is-good" matches "this is good".
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if target text(s) match a search query using multi-word tokenization
 * and hyphen/punctuation normalization.
 * 
 * Supports matching when:
 * 1. Normalized target contains the normalized query string.
 * 2. Original target contains the query string.
 * 3. ALL query keywords match somewhere in the target text or array of target texts.
 */
export function matchesSearchQuery(
  targets: string | null | undefined | (string | null | undefined)[],
  searchQuery: string
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;

  const rawQuery = searchQuery.trim().toLowerCase();
  const normalizedQuery = normalizeText(searchQuery);

  const targetArray = Array.isArray(targets) ? targets : [targets];
  const validTargets = targetArray.filter((t): t is string => typeof t === "string" && t.length > 0);

  if (validTargets.length === 0) return false;

  // Combine raw and normalized target representations
  const rawCombined = validTargets.map((t) => t.toLowerCase()).join(" ");
  const normalizedCombined = validTargets.map((t) => normalizeText(t)).join(" ");

  // Direct substring matches
  if (rawCombined.includes(rawQuery)) return true;
  if (normalizedQuery && normalizedCombined.includes(normalizedQuery)) return true;

  // Keyword token matching: ensure every query word appears in raw or normalized target
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return true;

  return queryTokens.every(
    (token) => rawCombined.includes(token) || normalizedCombined.includes(token)
  );
}
