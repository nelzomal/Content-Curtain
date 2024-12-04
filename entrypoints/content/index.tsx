import { ContentScriptContext } from "wxt/client";
import "@/assets/global.css";
import {
  analyzeContentSafety,
  checkPromptCapability,
  destroySession,
} from "./lib/ai/prompt";
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
import { withRetry } from "./lib/ai/utils";
import { checkWriterCapability } from "./lib/ai/write";

// Define message type
interface SettingsMessage {
  type: "SETTINGS_UPDATED";
  settings: Settings;
}

// Initialize settings from storage
let currentSettings: Settings = {
  contentAnalysisEnabled: true,
  contentStrictness: "medium",
  activePromptType: "nsfw",
  customPrompts: DEFAULT_PROMPTS,
};

// Load initial settings
async function initializeSettings() {
  const contentAnalysisEnabled = await storage.getItem<boolean>(
    "local:contentAnalysisEnabled",
    {
      fallback: true,
    }
  );

  const contentStrictness = await storage.getItem<StrictnessLevel>(
    "local:contentStrictness",
    {
      fallback: "medium",
    }
  );
  console.log("contentStrictness ", contentStrictness);
  const activePromptType = await storage.getItem<PromptType>(
    "local:activePromptType",
    {
      fallback: "nsfw",
    }
  );
  console.log("activePromptType ", activePromptType);

  currentSettings = {
    contentAnalysisEnabled: contentAnalysisEnabled,
    contentStrictness: contentStrictness,
    activePromptType: activePromptType,
    customPrompts: DEFAULT_PROMPTS,
  };

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
    const canPrompt = await checkPromptCapability();
    const canWrite = await checkWriterCapability();

    if (!canPrompt || !canWrite) {
      return;
    }

    const ui = new UIManager();

    await initializeSettings();

    // Use global browser.runtime API
    browser.runtime.onMessage.addListener(async (message: SettingsMessage) => {
      if (message.type === "SETTINGS_UPDATED") {
        console.log("Settings updated:", message.settings);

        // Update current settings
        // TODO: update settings
        await storage.setItem(
          "local:contentAnalysisEnabled",
          message.settings.contentAnalysisEnabled
        );
        await storage.setItem(
          "local:contentStrictness",
          message.settings.contentStrictness
        );
        await storage.setItem(
          "local:activePromptType",
          message.settings.activePromptType
        );
        currentSettings = message.settings;
      }
    });

    try {
      const textNodeBlocks = getVisibleTextNodeByWalker();
      const textBlocks = getVisbileTextBlocks(textNodeBlocks);
      if (currentSettings.contentAnalysisEnabled) {
        ui.showProcessing(
          "Analyzing Content",
          "Please wait while we analyze your content..."
        );

        const readableContent = extractReadableContent();

        if (!readableContent) {
          ui.hideProcessing();
          ui.showError("Could not extract content from this page");
          return;
        }

        const promptManager = new PromptManager();
        await promptManager.initialize();

        const safetyAnalysis = await withRetry(
          async () =>
            await analyzeContentSafety(readableContent.textContent, {
              strictness: currentSettings.contentStrictness,
            }),
          () => {
            return true;
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
      } else {
        ui.renderApp(ctx, textBlocks, true);
      }
    } catch (error) {
      ui.hideProcessing();
      ui.showError("An unexpected error occurred.");
      console.error("Error:", error);
    }
  },
});
