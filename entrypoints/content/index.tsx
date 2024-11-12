import React from "react";
import { createRoot } from "react-dom/client";
import { Readability } from "@mozilla/readability";
import { App } from "./app";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/assets/global.css";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article) {
      console.log("Could not extract content from this page");
      return;
    }

    const ui = await createShadowRootUi(ctx, {
      name: "reader-panel",
      position: "inline",
      anchor: "body",
      onMount: (container: HTMLElement) => {
        const root = createRoot(container);
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
