import {
  SafetyAnalysis,
  ContentSafetyLevel,
  SafetyAnalysisOptions,
} from "../types";
import {
  SYSTEM_PROMPT,
  MAX_TOKENS,
  WORD_COUNTS,
  SAFETY_LEVEL_PROMPT,
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

export async function destroySession() {
  if (!aiSession) {
    return;
  }
  aiSession.destroy();
  aiSession = null;
}

async function ensureSession(isClone: boolean = false) {
  if (!aiSession) {
    aiSession = await ai.languageModel.create({
      systemPrompt: SYSTEM_PROMPT,
    });
  }
  if (isClone) {
    return aiSession.clone();
  }
  return aiSession;
}

export async function sendMessage(
  message: string,
  isClone: boolean = false
): Promise<string> {
  try {
    const session = await ensureSession(isClone);
    const estimatedTokens = await session.countPromptTokens(
      SYSTEM_PROMPT + message
    );
    const processedMessage =
      estimatedTokens > 1500 ? truncateMessage(message) : message;

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("API call timeout")), 30000);
    });

    const responsePromise = session.prompt(processedMessage);
    const result = await Promise.race([responsePromise, timeoutPromise]);

    if (typeof result !== "string") {
      throw new Error("Invalid response from API");
    }

    return result;
  } catch (error) {
    console.error("Error in sendMessage:", {
      error,
      messagePreview: message.substring(0, 100),
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function analyzeContentSafety(
  text: string
): Promise<SafetyAnalysis> {
  const startTime = Date.now();
  try {
    const prompt = SAFETY_LEVEL_PROMPT.replace("{{text}}", text);
    const result = await sendMessage(prompt, true);
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

    if (safetyLevel !== "safe") {
      console.log(
        `Content not safe (${safetyLevel}):`,
        text.substring(0, 100) + "..."
      );
    }

    const analysis = {
      text,
      safetyNumber,
      safetyLevel,
      explanation: result,
    };

    return analysis;
  } catch (error) {
    console.error("Error in analyzeContentSafety:", {
      error,
      textPreview: text.substring(0, 100),
      elapsedMs: Date.now() - startTime,
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (text.includes("Our Services · Passport Services · Track your Pass")) {
      console.error("Error occurred while analyzing block 29:", {
        error,
        textLength: text.length,
        textPreview: text.substring(0, 100),
        elapsedMs: Date.now() - startTime,
      });
    }
    throw error;
  }
}
