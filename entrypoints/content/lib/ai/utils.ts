import { PromptConfig } from "../types";

export function parseSystemPromptResponse(
  systemPromptMessage: string
): string[] {
  const lines = systemPromptMessage.split(/\r?\n/); // Split input into lines
  const results: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (line.length === 0) continue; // Skip empty lines

    const regex = /^\s*(\d+\.\s*)?\*\*(.*?)\*\*\s*(.*)/;
    const match = regex.exec(line);

    if (match) {
      const textA = match[2].trim();
      const textB = match[3].trim();

      // Remove parentheses and angle brackets
      const cleanedTextA = textA.replace(/[()<>]/g, "").trim();
      // Normalize the text by removing digits, dots, and spaces
      const normalizedTextA = cleanedTextA
        .replace(/[\d.\s]/g, "")
        .toLowerCase();

      // Check if textA is "Moderation Rule" possibly with numbers or punctuation
      const isModerationRule = /^moderationrule$/i.test(normalizedTextA);

      if (isModerationRule) {
        // Return textB if available; otherwise, return textA
        if (textB.length > 0) {
          results.push(textB);
        } else {
          results.push(textA);
        }
      } else {
        results.push(textA);
      }
    }
  }

  return results;
}

export function parseSafetyLevelResponse(safetyLevelMessage: string): string[] {
  const lines = safetyLevelMessage.split(/\r?\n/); // Split input into lines
  const results: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (line.length === 0) continue; // Skip empty lines

    // Match content between ** **
    const regex = /\*\*(.*?)\*\*/;
    const match = regex.exec(line);

    if (match) {
      const content = match[1].trim();
      // Only include lines that start with digits and a dash (e.g., "0-2:", "3-4:")
      if (/^\d+-\d+:/.test(content)) {
        results.push(content);
      }
    }
  }

  return results;
}

// Add this retry utility function
export async function withRetry<T>(
  operation: () => Promise<T>,
  checker: (result: T) => boolean = () => true,
  maxAttempts: number = 5,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      console.log("Retry Result:", result);
      if (checker(result)) {
        return result;
      } else {
        throw new Error("Checker function returned false");
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);

      if (attempt === maxAttempts) break;

      // Wait before retrying, with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw new Error(
    `All ${maxAttempts} attempts failed. Last error: ${lastError?.message}`
  );
}

function cleanText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\*\*|\*\s/g, "").trim())
    .join("\n");
}

function generateSystemPrompt(systemPromptRules: string[]): string {
  return cleanText(`You are an AI prompt generator specializing in creating content rating guidelines.
        ${systemPromptRules.map((rule) => `- ${rule}`).join("\n")}

        General Guidelines:
        - Be concise but informative
        - If you don't know something, be honest about it
        - Always prioritize user safety and well-being`);
}

function generateSafetyLevelPrompt(safetyLevelPromptRules: string[]): string {
  return cleanText(
    `Rate the following text for adult content and violence on a scale of 0-10 where:
        ${safetyLevelPromptRules.map((rule) => `**${rule}**`).join("\n")}
    
        Provide the rating and a brief explanation without any details and any adult and violence content.
        Text to analyze: "{{text}}"`
  );
}

export function generatePromptConfig(
  systemPromptRules: string[],
  safetyLevelPromptRules: string[]
): PromptConfig {
  const systemPrompt = generateSystemPrompt(systemPromptRules);
  const safetyLevelPrompt = generateSafetyLevelPrompt(safetyLevelPromptRules);
  return {
    systemPrompt,
    safetyLevelPrompt,
    systemPromptRules,
    safetyLevelPromptRules,
  };
}
