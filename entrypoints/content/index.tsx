import React from "react";
import { createRoot } from "react-dom/client";
import { Readability } from "@mozilla/readability";
import { App } from "./app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContentScriptContext } from "wxt/client";
import "@/assets/global.css";
import { normalizeText } from "./lib/utils";
import { analyzeContentSafety } from "./lib/ai";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext): Promise<any> {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article) {
      console.log("Could not extract content from this page");
      return;
    }

    article.textContent = normalizeText(article.textContent);

    const safetyAnalysis = await analyzeContentSafety(article.textContent);
    if (safetyAnalysis.safetyLevel === "too sensitive") {
      console.log(
        "Content flagged as too sensitive:",
        safetyAnalysis.explanation
      );
      return;
    }

    const ui = await createShadowRootUi(ctx, {
      name: "reader-panel",
      position: "inline",
      anchor: "body",
      onMount: (container: HTMLElement) => {
        const rootContainer = document.createElement("div");
        rootContainer.id = "reader-panel-root";
        container.appendChild(rootContainer);

        const root = createRoot(rootContainer);
        root.render(
          <TooltipProvider>
            <App article={article} />
          </TooltipProvider>
        );
      },
    });

    ui.mount();
  },
});
