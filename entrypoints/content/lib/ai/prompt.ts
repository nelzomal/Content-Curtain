import {
  SafetyAnalysis,
  ContentSafetyLevel,
  SafetyAnalysisOptions,
  PromptConfig,
  PromptType,
  Settings,
  ThresholdsMap,
} from "../types";
import {
  MAX_TOKENS,
  WORD_COUNTS,
  DEFAULT_PROMPTS,
  DEFAULT_SETTINGS,
} from "../constant";
import { storage } from "wxt/storage";

let aiSession: AISession | null = null;

// Helper functions
function truncateMessage(
  message: string,
  maxTokens: number = MAX_TOKENS
): string {
  if (message.length <= maxTokens) return message;

  const words = message.split(/\s+/);
  const { START, MIDDLE, END } = WORD_COUNTS;

  if (words.length <= START + MIDDLE + END) return message;

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

async function getSystemPrompt(): Promise<string> {
  const settings =
    (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
  const customPrompts = settings.customPrompts ?? DEFAULT_PROMPTS;
  return customPrompts[settings.activePromptType].systemPrompt;
}

async function ensureSession(isClone: boolean = false): Promise<AISession> {
  if (!aiSession) {
    const systemPrompt = await getSystemPrompt();
    aiSession = await ai.languageModel.create({
      systemPrompt,
    });
  }
  return isClone ? aiSession.clone() : aiSession;
}

// Main functions
export async function destroySession(): Promise<void> {
  if (aiSession) {
    await aiSession.destroy();
    aiSession = null;
  }
}

export async function sendMessage(
  message: string,
  isClone: boolean = false
): Promise<string> {
  try {
    const session = await ensureSession(isClone);
    const systemPrompt = await getSystemPrompt();
    const estimatedTokens = await session.countPromptTokens(
      systemPrompt + message
    );
    const processedMessage =
      estimatedTokens > 1500 ? truncateMessage(message) : message;

    const response = await Promise.race([
      session.prompt(processedMessage),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("API call timeout")), 30000)
      ),
    ]);

    if (typeof response !== "string") {
      throw new Error("Invalid response from API");
    }

    return response;
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
  text: string,
  options: SafetyAnalysisOptions = { strictness: "medium" }
): Promise<SafetyAnalysis> {
  const startTime = Date.now();

  try {
    const settings =
      (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
    const effectiveStrictness =
      settings.contentStrictness ?? options.strictness;

    const prompt = settings.customPrompts[
      settings.activePromptType
    ].safetyLevelPrompt.replace("{{text}}", text);

    const result = await sendMessage(prompt, true);
    const safetyNumber = parseInt(result.match(/(\d+)/)?.[0] ?? "0");

    const thresholdsMap: ThresholdsMap = {
      low: { safe: 10, moderate: 10 },
      medium: { safe: 2, moderate: 7 },
      high: { safe: -1, moderate: -1 },
    };

    const thresholds =
      thresholdsMap[effectiveStrictness as keyof ThresholdsMap];
    const safetyLevel: ContentSafetyLevel =
      safetyNumber <= thresholds.safe
        ? "safe"
        : safetyNumber >= thresholds.moderate
        ? "too sensitive"
        : "moderate";

    return {
      text,
      safetyNumber,
      safetyLevel,
      explanation: result,
    };
  } catch (error) {
    console.error("Error in analyzeContentSafety:", {
      error,
      textPreview: text.substring(0, 100),
      elapsedMs: Date.now() - startTime,
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export class PromptManager {
  async initialize(): Promise<void> {
    const stored = await storage.getItem("local:customPrompts");
    if (!stored) {
      await Promise.all([
        storage.setItem("local:customPrompts", DEFAULT_PROMPTS),
        storage.setItem("local:activePromptType", "nsfw" as PromptType),
        storage.setItem("local:settings", DEFAULT_SETTINGS),
      ]);
    }
  }

  async getActivePrompts(): Promise<PromptConfig> {
    const settings =
      (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
    const customPrompts =
      (await storage.getItem<Record<PromptType, PromptConfig>>(
        "local:customPrompts"
      )) ?? DEFAULT_PROMPTS;
    return customPrompts[
      settings.activePromptType as keyof typeof customPrompts
    ];
  }

  async updatePrompts(type: PromptType, config: PromptConfig): Promise<void> {
    const customPrompts =
      (await storage.getItem<Record<PromptType, PromptConfig>>(
        "local:customPrompts"
      )) ?? DEFAULT_PROMPTS;
    await storage.setItem("local:customPrompts", {
      ...customPrompts,
      [type]: config,
    });
  }

  async setActivePromptType(type: PromptType): Promise<void> {
    const settings =
      (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
    await storage.setItem("local:settings", {
      ...settings,
      activePromptType: type,
    });
  }

  async resetToDefault(type: PromptType): Promise<void> {
    await this.updatePrompts(type, DEFAULT_PROMPTS[type]);
  }
}
