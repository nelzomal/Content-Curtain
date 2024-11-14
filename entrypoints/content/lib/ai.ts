import { SafetyAnalysis, ContentSafetyLevel } from "./types";
import {
  SYSTEM_PROMPT,
  MAX_TOKENS,
  WORD_COUNTS,
  SENSITIVITY_RATING_PROMPT,
} from "./constant";

let aiSession: any = null;

function truncateMessage(
  message: string,
  maxTokens: number = MAX_TOKENS
): string {
  if (message.length <= maxTokens) return message;

  const words = message.split(/\s+/);
  const { START, MIDDLE, END } = WORD_COUNTS;

  if (words.length <= START + MIDDLE + END) {
    return message;
  }

  const start = words.slice(0, START).join(" ");
  const middle = words
    .slice(
      Math.floor(words.length / 2) - MIDDLE / 2,
      Math.floor(words.length / 2) + MIDDLE / 2
    )
    .join(" ");
  const end = words.slice(-END).join(" ");

  return `${start}\n\n[...]\n\n${middle}\n\n[...]\n\n${end}`;
}

export async function ensureSession() {
  if (!aiSession) {
    aiSession = await ai.languageModel.create({
      systemPrompt: SYSTEM_PROMPT,
    });
  }
  return aiSession;
}

export async function analyzeSensitivity(
  text: string
): Promise<SafetyAnalysis> {
  try {
    const prompt = SENSITIVITY_RATING_PROMPT.replace("{{text}}", text);
    const result = await sendMessage(prompt);

    // Parse the AI response
    const match = result.match(/(\d+)/);
    const level = match ? parseInt(match[0]) : 0;

    return {
      text,
      safetyNumber: level,
      explanation: result,
    };
  } catch (error) {
    console.error("Error in analyzeSensitivity:", error);
    throw error;
  }
}

export async function sendMessage(message: string): Promise<string> {
  try {
    const session = await ensureSession();
    const estimatedTokens = await session.countPromptTokens(
      SYSTEM_PROMPT + message
    );
    const processedMessage =
      estimatedTokens > 1500 ? truncateMessage(message) : message;

    return await session.prompt(processedMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}

export async function analyzeContentSafety(
  text: string
): Promise<SafetyAnalysis> {
  try {
    const sensitivity = await analyzeSensitivity(text);

    let safetyLevel: ContentSafetyLevel;
    if (sensitivity.safetyNumber <= 2) {
      sensitivity.safetyLevel = "safe";
    } else if (sensitivity.safetyNumber >= 7) {
      sensitivity.safetyLevel = "too sensitive";
    } else {
      sensitivity.safetyLevel = "OK";
    }

    return sensitivity;
  } catch (error) {
    console.error("Error in analyzeContentSafety:", error);
    throw error;
  }
}
