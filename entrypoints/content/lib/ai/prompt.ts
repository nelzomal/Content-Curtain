import {
  SafetyAnalysis,
  ContentSafetyLevel,
  SafetyAnalysisOptions,
  PromptConfig,
  PromptType,
  Settings,
} from "../types";
import { MAX_TOKENS, WORD_COUNTS, DEFAULT_PROMPTS } from "../constant";
import { getSettings } from "../../index";
import { storage } from "wxt/storage";

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

async function getSystemPrompt() {
  const settings = await storage.getItem<Settings>("local:settings");
  const customPrompts = settings?.customPrompts || DEFAULT_PROMPTS;
  const activePromptType = settings?.activePromptType || "nsfw";
  return customPrompts[activePromptType].systemPrompt;
}
async function ensureSession(isClone: boolean = false) {
  if (!aiSession) {
    const systemPrompt = await getSystemPrompt();
    console.log("systemPrompt ", systemPrompt);
    aiSession = await ai.languageModel.create({
      systemPrompt: systemPrompt,
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
    const systemPrompt = await getSystemPrompt();
    const estimatedTokens = await session.countPromptTokens(
      systemPrompt + message
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
  text: string,
  options: SafetyAnalysisOptions = { strictness: "medium" }
): Promise<SafetyAnalysis> {
  const startTime = Date.now();
  try {
    const settings = getSettings();
    const effectiveStrictness =
      settings?.contentStrictness || options.strictness;

    const prompt = settings.customPrompts[
      settings.activePromptType
    ].safetyLevelPrompt.replace("{{text}}", text);
    console.log("prompt ", prompt);
    console.log("settings ", settings);
    const result = await sendMessage(prompt, true);
    const match = result.match(/(\d+)/);
    const safetyNumber = match ? parseInt(match[0]) : 0;

    type ThresholdConfig = {
      safe: number;
      moderate: number;
    };

    type ThresholdsMap = {
      low: ThresholdConfig;
      medium: ThresholdConfig;
      high: ThresholdConfig;
    };

    const thresholdsMap: ThresholdsMap = {
      low: {
        safe: 10,
        moderate: 10,
      },
      medium: {
        safe: 2,
        moderate: 7,
      },
      high: {
        safe: -1,
        moderate: -1,
      },
    };

    const thresholds =
      thresholdsMap[effectiveStrictness as keyof ThresholdsMap];

    let safetyLevel: ContentSafetyLevel;
    if (safetyNumber <= thresholds.safe) {
      safetyLevel = "safe";
    } else if (safetyNumber >= thresholds.moderate) {
      safetyLevel = "too sensitive";
    } else {
      safetyLevel = "moderate";
    }

    const analysis = {
      text,
      safetyNumber,
      safetyLevel,
      explanation: result,
      appliedStrictness: effectiveStrictness,
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

    throw error;
  }
}

export class PromptManager {
  constructor() {}

  async initialize() {
    const stored = await storage.getItem("local:customPrompts");
    if (!stored) {
      await storage.setItem("local:customPrompts", DEFAULT_PROMPTS);
      await storage.setItem("local:activePromptType", "nsfw" as PromptType);
      await storage.setItem("local:settings", {
        contentAnalysisEnabled: true,
        contentStrictness: "medium",
        activePromptType: "nsfw",
        customPrompts: DEFAULT_PROMPTS,
      } as Settings);
    }
  }

  async getActivePrompts(): Promise<PromptConfig> {
    const settings = await storage.getItem<Settings>("local:settings");
    const customPrompts = await storage.getItem<
      Record<PromptType, PromptConfig>
    >("local:customPrompts");

    const safeSettings: Settings = settings || {
      contentAnalysisEnabled: true,
      contentStrictness: "medium",
      activePromptType: "nsfw",
      customPrompts: DEFAULT_PROMPTS,
    };

    const safePrompts: Record<PromptType, PromptConfig> =
      customPrompts || DEFAULT_PROMPTS;

    return safePrompts[safeSettings.activePromptType];
  }

  async updatePrompts(type: PromptType, config: PromptConfig) {
    const customPrompts = await storage.getItem<
      Record<PromptType, PromptConfig>
    >("local:customPrompts");

    const safePrompts: Record<PromptType, PromptConfig> =
      customPrompts || DEFAULT_PROMPTS;

    safePrompts[type] = config;
    await storage.setItem("local:customPrompts", safePrompts);
  }

  async setActivePromptType(type: PromptType) {
    const settings = await storage.getItem<Settings>("local:settings");

    const safeSettings: Settings = settings || {
      contentAnalysisEnabled: true,
      contentStrictness: "medium",
      activePromptType: "nsfw",
      customPrompts: DEFAULT_PROMPTS,
    };

    safeSettings.activePromptType = type;
    await storage.setItem("local:settings", safeSettings);
  }

  async resetToDefault(type: PromptType) {
    await this.updatePrompts(type, DEFAULT_PROMPTS[type]);
  }
}
