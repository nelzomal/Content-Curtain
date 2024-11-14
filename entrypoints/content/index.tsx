import { ContentScriptContext } from "wxt/client";
import "@/assets/global.css";
import { analyzeContent } from "./lib/contentAnalysis";
import { UIManager } from "./uiManager";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext): Promise<any> {
    const ui = new UIManager();

    try {
      const result = await analyzeContent();
      console.log("result: ", result);
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

      await ui.renderApp(ctx, result.article!);
    } catch (error) {
      ui.showError("An unexpected error occurred.");
      console.error("Error:", error);
    }
  },
});
