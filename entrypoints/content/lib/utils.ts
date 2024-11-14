// a function take a string and return a string
// for spaces between words, keep only one space
// for new lines between sentences, keep only one new line

import { Readability } from "@mozilla/readability";
import { Article } from "./types";

export function normalizeText(text: string): string {
  // First, replace multiple spaces with a single space
  const normalizedSpaces = text.replace(/\s+/g, " ");

  // Then, replace multiple newlines with a single newline
  // and trim any leading/trailing whitespace
  return normalizedSpaces.replace(/\n\s*\n/g, "\n").trim();
}

export function extractReadableContent(): Article | null {
  const documentClone = document.cloneNode(true) as Document;
  const reader = new Readability(documentClone);
  return reader.parse();
}
