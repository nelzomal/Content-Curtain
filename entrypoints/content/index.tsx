import { ContentScriptContext } from "wxt/client";
import "@/assets/global.css";
import { analyzeContent } from "./lib/ai/contentAnalysis";
import { UIManager } from "./uiManager";
import {
  getVisibleTextNodeByWalker,
  getVisbileTextBlocks,
} from "./lib/ui/page_parser";
import { extractReadableContent } from "./lib/utils";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext): Promise<any> {
    const ui = new UIManager();

    try {
      // Show loading message before starting analysis
      ui.showProcessing(
        "Analyzing Content",
        "Please wait while we analyze your content..."
      );

      // Get text blocks using page parser
      const textNodeBlocks = getVisibleTextNodeByWalker();
      const textBlocks = getVisbileTextBlocks(textNodeBlocks);

      console.log("textBlocks: ", textBlocks);

      // Analyze the content
      const readableContent = await extractReadableContent();
      const analyzedReadableContent = await analyzeContent(readableContent);
      console.log("result: ", analyzedReadableContent);

      // Remove the processing message
      ui.hideProcessing();

      if (analyzedReadableContent.error) {
        ui.showError(analyzedReadableContent.error.message);
        return;
      }

      if (
        analyzedReadableContent.safetyAnalysis?.safetyLevel === "too sensitive"
      ) {
        ui.showContentWarning(
          analyzedReadableContent.safetyAnalysis.explanation ||
            "This content has been flagged as sensitive"
        );
        return;
      }

      await ui.renderApp(ctx, textBlocks);
    } catch (error) {
      // Make sure to hide the processing message if there's an error
      ui.hideProcessing();
      ui.showError("An unexpected error occurred.");
      console.error("Error:", error);
    }
  },
});
