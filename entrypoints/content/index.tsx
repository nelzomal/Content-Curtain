import { ContentScriptContext } from "wxt/client";
import "@/assets/global.css";
import { analyzeContent } from "./lib/ai/contentAnalysis";
import { UIManager } from "./uiManager";
import { getTextNodeByWalker, getTextBlocks } from "./lib/ui/page_parser";

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
      const textNodeBlocks = getTextNodeByWalker();
      const textBlocks = getTextBlocks(textNodeBlocks);

      // Analyze the content
      const result = await analyzeContent();
      console.log("result: ", result);

      // Remove the processing message
      ui.hideProcessing();

      if (result.error) {
        ui.showError(result.error.message);
        return;
      }

      if (result.safetyAnalysis?.safetyLevel === "too sensitive") {
        ui.showContentWarning(
          result.safetyAnalysis.explanation ||
            "This content has been flagged as sensitive"
        );
        return;
      }

      // Add parsed blocks to the article content
      const articleWithBlocks = {
        ...result.article!,
        parsedBlocks: textBlocks,
      };

      await ui.renderApp(ctx, articleWithBlocks);
    } catch (error) {
      // Make sure to hide the processing message if there's an error
      ui.hideProcessing();
      ui.showError("An unexpected error occurred.");
      console.error("Error:", error);
    }
  },
});
