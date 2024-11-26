import { ContentScriptContext } from "wxt/client";
import "@/assets/global.css";
import { analyzeContentSafety, destroySession } from "./lib/ai/prompt";
import { UIManager } from "./uiManager";
import {
  getVisibleTextNodeByWalker,
  getVisbileTextBlocks,
} from "./lib/ui/page_parser";
import { extractReadableContent } from "./lib/utils";
import { showToast } from "./lib/ui/overlay";
import { storage } from "wxt/storage";
import type { StrictnessLevel, PromptType, Settings } from "./lib/types";
import { PromptManager } from "./lib/ai/prompt";
import { DEFAULT_PROMPTS } from "./lib/constant";

// Define message type
interface SettingsMessage {
  type: "SETTINGS_UPDATED";
  settings: {
    contentAnalysisEnabled: boolean;
    contentStrictness: StrictnessLevel;
    activePromptType: PromptType;
  };
}

// Initialize settings from storage
let currentSettings: Settings = {
  contentAnalysisEnabled: true,
  contentStrictness: "medium",
  activePromptType: "nsfw",
  customPrompts: DEFAULT_PROMPTS,
};

let aiSession: any = null;

// Load initial settings
async function initializeSettings() {
  const contentAnalysisEnabled = storage.defineItem<boolean>(
    "local:contentAnalysisEnabled",
    {
      fallback: true,
    }
  );

  const contentStrictness = storage.defineItem<StrictnessLevel>(
    "local:contentStrictness",
    {
      fallback: "medium",
    }
  );
  console.log("contentStrictness ", contentStrictness);
  const activePromptType = storage.defineItem<PromptType>(
    "local:activePromptType",
    {
      fallback: "nsfw",
    }
  );
  console.log("activePromptType ", activePromptType);
  const settings = await storage.getItem<Settings>("local:settings");
  console.log("settings ", settings);

  if (settings) {
    currentSettings = settings;
  } else {
    const [enabled, strictness, promptType] = await Promise.all([
      contentAnalysisEnabled.getValue(),
      contentStrictness.getValue(),
      activePromptType.getValue(),
    ]);

    currentSettings = {
      contentAnalysisEnabled: enabled,
      contentStrictness: strictness,
      activePromptType: promptType,
      customPrompts: DEFAULT_PROMPTS,
    };
  }

  console.log("Initialized settings:", currentSettings);
}

// Export settings for use in other modules
export function getSettings() {
  return currentSettings;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext): Promise<any> {
    const ui = new UIManager();

    await initializeSettings();

    // Use global browser.runtime API
    browser.runtime.onMessage.addListener(async (message: SettingsMessage) => {
      if (message.type === "SETTINGS_UPDATED") {
        console.log("Settings updated:", message.settings);

        // Update current settings
        currentSettings = {
          ...currentSettings,
          ...message.settings,
        };

        // Save updated settings to storage
        await storage.setItem("local:settings", currentSettings);

        console.log("Settings saved to storage:", currentSettings);

        // Optionally reload the page to apply new settings
        // window.location.reload();
      }
    });

    try {
      if (!currentSettings.contentAnalysisEnabled) {
        return;
      }

      ui.showProcessing(
        "Analyzing Content",
        "Please wait while we analyze your content..."
      );

      const textNodeBlocks = getVisibleTextNodeByWalker();
      const textBlocks = getVisbileTextBlocks(textNodeBlocks);
      const readableContent = extractReadableContent();

      if (!readableContent) {
        ui.hideProcessing();
        ui.showError("Could not extract content from this page");
        return;
      }

      const promptManager = new PromptManager();
      await promptManager.initialize();

      // Get active prompts when needed
      const activePrompts = await promptManager.getActivePrompts();

      // Create AI session with active prompt
      aiSession = await ai.languageModel.create({
        systemPrompt: activePrompts.systemPrompt,
      });

      const safetyAnalysis = await analyzeContentSafety(
        readableContent.textContent,
        {
          strictness: currentSettings.contentStrictness,
        }
      );

      await destroySession();
      console.log("Safety analysis:", safetyAnalysis);
      ui.hideProcessing();

      const resultToast = {
        safe: {
          message: "✓ Content is safe",
          type: "success" as const,
        },
        moderate: {
          message: "⚠️ Content contains moderate material",
          type: "warning" as const,
        },
        "too sensitive": {
          message: "⛔ Content is sensitive",
          type: "error" as const,
        },
      }[safetyAnalysis.safetyLevel!];

      showToast(resultToast);

      switch (safetyAnalysis.safetyLevel) {
        case "safe":
          ui.renderApp(ctx, textBlocks, false);
          break;

        case "moderate":
          ui.renderApp(ctx, textBlocks, true);
          break;

        case "too sensitive":
          ui.showContentWarning(
            safetyAnalysis.explanation ||
              "This content has been flagged as sensitive"
          );
          return;
      }
    } catch (error) {
      ui.hideProcessing();
      ui.showError("An unexpected error occurred.");
      console.error("Error:", error);
    }
  },
});
