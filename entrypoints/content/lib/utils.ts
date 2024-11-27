import { Readability } from "@mozilla/readability";
import { Article } from "./types";

export function normalizeText(text: string): string {
  const normalizedSpaces = text.replace(/\s+/g, " ");
  return normalizedSpaces.replace(/\n\s*\n/g, "\n").trim();
}

export function extractReadableContent(): Article | null {
  const documentClone = document.cloneNode(true) as Document;
  const reader = new Readability(documentClone);
  return reader.parse();
}
