import { ContentScriptContext } from "wxt/client";
import "@/assets/global.css";
import { analyzeContent } from "./lib/contentAnalysis";
import { UIManager } from "./uiManager";
import { write, writeStreaming } from "./lib/ai/write";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext): Promise<any> {
    const ui = new UIManager();

    try {
      // console.log("result1 write: ");
      // const result1 = await write("A draft for an inquiry...");
      // console.log("result1: ", result1);

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
