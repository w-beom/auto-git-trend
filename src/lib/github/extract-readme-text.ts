function collapseBlankLines(lines: string[]): string[] {
  const result: string[] = [];

  for (const line of lines) {
    if (line === "" && result[result.length - 1] === "") {
      continue;
    }

    result.push(line);
  }

  while (result[0] === "") {
    result.shift();
  }

  while (result[result.length - 1] === "") {
    result.pop();
  }

  return result;
}

export function extractReadmeText(readme: string | null): string | null {
  const normalized = readme?.trim();

  if (!normalized) {
    return null;
  }

  const text = normalized
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "\n")
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/\[\s*!\[[^\]]*]\([^)]+\)\s*]\([^)]+\)/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<\/?(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p|section|article|header|footer|main|aside|blockquote|details|summary|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6])[^>]*>/gi, "\n")
    .replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/gi, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*+]\s+|\d+\.\s+)/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/`([^`]+)`/g, "$1");

  const cleanedLines = collapseBlankLines(
    text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim()),
  );

  const result = cleanedLines.join("\n").trim();
  return result || null;
}
