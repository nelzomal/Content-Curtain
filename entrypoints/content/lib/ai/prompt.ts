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
import {
  generatePromptConfig,
  parseSafetyLevelResponse,
  parseSystemPromptResponse,
  withRetry,
} from "./utils";
import { createWriter } from "./write";

let aiSession: AISession | null = null;

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
  const activePrompt = customPrompts[settings.activePromptType];

  if (!activePrompt?.systemPrompt) {
    return (
      DEFAULT_PROMPTS[settings.activePromptType]?.systemPrompt ||
      "You are an AI assistant helping with content moderation."
    );
  }

  return activePrompt.systemPrompt;
}

async function ensureSession(
  isClone: boolean = false,
  systemPrompt?: string,
  isNew: boolean = false
): Promise<AISession> {
  if (isNew && aiSession) {
    await destroySession();
  }
  if (!aiSession) {
    if (!systemPrompt) {
      systemPrompt = await getSystemPrompt();
    }
    aiSession = await ai.languageModel.create({
      systemPrompt,
    });
  }
  return isClone ? aiSession.clone() : aiSession;
}

export async function destroySession(): Promise<void> {
  if (aiSession) {
    aiSession.destroy();
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
    throw error;
  }
}

export async function analyzeContentSafety(
  text: string,
  options: SafetyAnalysisOptions = { strictness: "medium" }
): Promise<SafetyAnalysis> {
  try {
    const settings =
      (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
    const effectiveStrictness =
      settings.contentStrictness ?? options.strictness;

    const prompt = settings.customPrompts[
      settings.activePromptType
    ].safetyLevelPrompt!.replace("{{text}}", text);

    const result = await sendMessage(prompt, true);
    await ensureSession(
      false,
      `Don't mention the original content. Don't provide any details. Just provide what kind of the info is leaked.
      in the following format: "Those info has been leaked: <type of the info>"`,
      true
    );
    const newPrompt = `What kind of the info is leaked? ${result}`;
    const refinedExplanation = await sendMessage(newPrompt, false);

    const safetyNumber = parseInt(result.match(/(\d+)/)?.[0] ?? "0");

    const thresholdsMap: ThresholdsMap = {
      low: { safe: 7, moderate: 9 },
      medium: { safe: 2, moderate: 7 },
      high: { safe: 0, moderate: 2 },
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
      explanation: refinedExplanation,
    };
  } catch (error) {
    throw error;
  }
}

export class PromptManager {
  private readonly validRanges = ["0-2", "3-4", "5-6", "7-8", "9-10"] as const;

  async initialize(): Promise<void> {
    const stored = await storage.getItem("local:customPrompts");

    if (!stored) {
      try {
        await Promise.all([
          storage.setItem("local:customPrompts", DEFAULT_PROMPTS),
          storage.setItem("local:activePromptType", "nsfw" as PromptType),
          storage.setItem("local:settings", {
            ...DEFAULT_SETTINGS,
            customPrompts: DEFAULT_PROMPTS,
            activePromptType: "nsfw",
          }),
        ]);
      } catch (error) {
        throw error;
      }
    }
  }

  async getActivePrompts(): Promise<PromptConfig> {
    const settings =
      (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
    const customPrompts =
      (await storage.getItem<Record<PromptType, PromptConfig>>(
        "local:customPrompts"
      )) ?? DEFAULT_PROMPTS;

    return (
      customPrompts[settings.activePromptType] ??
      DEFAULT_PROMPTS[settings.activePromptType]
    );
  }

  async setActivePromptType(type: PromptType): Promise<void> {
    const settings =
      (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
    await storage.setItem("local:settings", {
      ...settings,
      activePromptType: type,
    });
  }

  async generateCustomPrompts(
    filterDescription: string
  ): Promise<PromptConfig> {
    const fallbackSystemPrompt =
      "You are an AI prompt generator specializing in creating content rating guidelines.";

    try {
      await this.initialize();

      const writer = await createWriter({
        tone: "formal",
        length: "short",
        sharedContext: `You are an AI prompt generator specializing in creating content rating guidelines.`,
      });

      const systemPrompt = await getSystemPrompt().catch(
        () => fallbackSystemPrompt
      );

      await ensureSession(false, systemPrompt, true);

      try {
        const rules = await withRetry(
          async () => {
            const systemPrompt = await writer.write(
              `Generate prompts for Content Moderation Rules for "${filterDescription}": 
                List four rules in JSON format, key is number, value is rule.
              `
            );
            return Object.values(JSON.parse(systemPrompt)) as string[];
          },
          (result) => result.length > 3
        );

        const safetyLevelMessage = `Follow the example format:
          Example:
          {"0-2": "No adult content or violence",
          "3-4": "Mild references to adult themes or mild violence (like pushing)",
          "5-6": "Moderate adult content or violence (fighting, mild gore)",
          "7-8": "Strong adult content or violence",
          "9-10": "Extreme adult content or extreme violence"}

          Generate prompts for a content rating guideline for "${filterDescription}" on a scale of 0-10.
          List 5 rating rules in JSON format, key is string like "0-2", "9-10", value is rating guideline.`;

        const safetyLevels = await withRetry(
          async () => {
            const safetyLevelResponse = await writer.write(safetyLevelMessage);
            const parsedResponse = JSON.parse(safetyLevelResponse);

            const hasValidKeys = this.validRanges.every(
              (range) => range in parsedResponse
            );

            if (!hasValidKeys) {
              throw new Error(
                "Invalid safety level ranges. Expected: 0-2, 3-4, 5-6, 7-8, 9-10"
              );
            }

            return Object.entries(parsedResponse).map(
              ([key, value]) => `${key}: ${value}`
            );
          },
          (result: string[]) => {
            return (
              result.length >= 5 &&
              result.every((rule) =>
                this.validRanges.some((range) => rule.startsWith(range))
              )
            );
          }
        );

        const promptConfig = generatePromptConfig(rules, safetyLevels);

        if (
          !promptConfig.systemPromptRules ||
          !promptConfig.safetyLevelPromptRules
        ) {
          throw new Error("Invalid prompt generation response format");
        }

        return promptConfig;
      } catch (error) {
        throw new Error(`Failed to generate custom prompts: ${error}`);
      }
    } catch (error) {
      throw error;
    }
  }
}

export async function checkPromptCapability(): Promise<boolean> {
  try {
    return (await ai.languageModel.capabilities()) !== null;
  } catch (error) {
    console.error(
      "[checkPromptCapability] Language model check failed:",
      error
    );
    return false;
  }
}
