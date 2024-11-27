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
  console.log("Getting system prompt...");
  const settings =
    (await storage.getItem<Settings>("local:settings")) ?? DEFAULT_SETTINGS;
  console.log("Retrieved settings:", settings);

  const customPrompts = settings.customPrompts ?? DEFAULT_PROMPTS;
  console.log("Active prompt type:", settings.activePromptType);
  console.log("Custom prompts:", customPrompts);

  const activePrompt = customPrompts[settings.activePromptType];
  console.log("Active prompt:", activePrompt);

  if (!activePrompt?.systemPrompt) {
    console.warn("No system prompt found, using default");
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

// Main functions
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
    console.error("Error in sendMessage:", {
      error,
      messagePreview: message.substring(0, 100),
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
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
    console.log("Settings:_______________________________________\n", settings);
    const effectiveStrictness =
      settings.contentStrictness ?? options.strictness;

    const prompt = settings.customPrompts[
      settings.activePromptType
    ].safetyLevelPrompt!.replace("{{text}}", text);

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
    console.log("Initializing PromptManager...");
    const stored = await storage.getItem("local:customPrompts");
    console.log("Stored custom prompts:", stored);

    if (!stored) {
      console.log("No stored prompts found, setting defaults...");
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
        console.log("Default settings initialized successfully");
      } catch (error) {
        console.error("Error initializing settings:", error);
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

    // Return custom prompt if it exists, otherwise fall back to default
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
    console.log("Generating custom prompts for:", filterDescription);

    // Default system prompt if the custom one fails
    const fallbackSystemPrompt =
      "You are an AI prompt generator specializing in creating content rating guidelines.";

    try {
      // Ensure settings are initialized
      await this.initialize();

      const systemPrompt = await getSystemPrompt().catch((err) => {
        console.warn("Error getting system prompt, using fallback:", err);
        return fallbackSystemPrompt;
      });

      await ensureSession(false, systemPrompt, true);

      const systemPromptMessage = `Follow the example format:
        **Strictly avoid any adult themes, violence, inappropriate language, or mature content**
        **Immediately reject requests involving harmful, dangerous, or unsafe activities**
        **Keep responses educational and family-friendly**
        **If a topic is inappropriate for children, politely decline to discuss it**

        Generate prompts for Content Moderation Rules for "${filterDescription}": 
        List four rules in **<moderation rule>** format.
      `;

      try {
        const rules = await withRetry(
          async () => {
            const systemPromptResponse = await sendMessage(
              systemPromptMessage,
              true
            );
            return parseSystemPromptResponse(systemPromptResponse);
          },
          (result) => result.length > 3
        );

        const safetyLevelMessage = `Follow the example format:
          Example:
          **0-2: No adult content or violence**
          **3-4: Mild references to adult themes or mild violence (like pushing)**
          **5-6: Moderate adult content or violence (fighting, mild gore)**
          **7-8: Strong adult content or violence**
          **9-10: Extreme adult content or extreme violence**

          Generate prompts for a content rating guideline for "${filterDescription}" on a scale of 0-10.
          List 5 rating rules in **0-2 rating rule** format.
          rating rule is short and concise, no need to explain the rule.`;

        const safetyLevels = await withRetry(
          async () => {
            const safetyLevelResponse = await sendMessage(
              safetyLevelMessage,
              true
            );
            return parseSafetyLevelResponse(safetyLevelResponse);
          },
          (result) => result.length >= 5
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
        console.error("Error details:", {
          error,
          type: error instanceof Error ? error.name : typeof error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error(`Failed to generate custom prompts: ${error}`);
      }
    } catch (error) {
      console.error("Error in generateCustomPrompts:", {
        error,
        filterDescription,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
