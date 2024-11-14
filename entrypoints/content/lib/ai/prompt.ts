import {
  SafetyAnalysis,
  ContentSafetyLevel,
  SafetyAnalysisOptions,
} from "../types";
import {
  SYSTEM_PROMPT,
  MAX_TOKENS,
  WORD_COUNTS,
  SENSITIVITY_RATING_PROMPT as SAFETY_LEVEL_PROMPT,
} from "../constant";

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
    const prompt = SAFETY_LEVEL_PROMPT.replace("{{text}}", text);
    const result = await sendMessage(prompt);

    // Parse the AI response
    const match = result.match(/(\d+)/);
    const safetyNumber = match ? parseInt(match[0]) : 0;

    let safetyLevel: ContentSafetyLevel;
    if (safetyNumber <= 2) {
      safetyLevel = "safe";
    } else if (safetyNumber >= 7) {
      safetyLevel = "too sensitive";
    } else {
      safetyLevel = "OK";
    }

    return {
      text,
      safetyNumber,
      safetyLevel,
      explanation: result,
    };
  } catch (error) {
    console.error("Error in analyzeContentSafety:", error);
    throw error;
  }
}

export async function* analyzeContentSafetyBatch(
  texts: string[],
  options: SafetyAnalysisOptions = {}
): AsyncGenerator<SafetyAnalysis, void, unknown> {
  const batchSize = options.batchSize || 3; // Default to 3 concurrent requests

  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(async (text, index) => {
      try {
        const result = await analyzeContentSafety(text);
        return { result, index: i + index };
      } catch (error) {
        console.error(`Error analyzing text at index ${i + index}:`, error);
        return null;
      }
    });

    // Use Promise.allSettled to handle individual promise failures
    const batchResults = await Promise.allSettled(batchPromises);

    for (const settledResult of batchResults) {
      if (
        settledResult.status === "fulfilled" &&
        settledResult.value !== null
      ) {
        yield settledResult.value.result;
      }
    }
  }
}
