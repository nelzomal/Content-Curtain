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

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext): Promise<any> {
    const ui = new UIManager();

    try {
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

      const safetyAnalysis = await analyzeContentSafety(
        readableContent.textContent
      );
      await destroySession();

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
