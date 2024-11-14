import { type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ContentScriptContext } from "wxt/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { App } from "./app";
import { type Article } from "./lib/contentAnalysis";
import {
  createBlurOverlay,
  showMessage,
  removeBlurOverlay,
} from "./lib/overlay";
import { createShadowRootUi } from "wxt/client";

declare global {
  namespace JSX {
    interface Element extends ReactElement {}
  }
}

export class UIManager {
  private blurOverlay: HTMLDivElement;

  constructor() {
    this.blurOverlay = createBlurOverlay();
  }

  showError(message: string): void {
    showMessage(this.blurOverlay, {
      title: "Error",
      message,
    });
  }

  showContentWarning(explanation: string): void {
    showMessage(this.blurOverlay, {
      title: "Content Warning",
      message: explanation || "This content has been flagged as sensitive",
    });
  }

  async renderApp(ctx: ContentScriptContext, article: Article): Promise<void> {
    removeBlurOverlay(this.blurOverlay);

    const ui = await createShadowRootUi(ctx, {
      name: "reader-panel",
      position: "inline",
      anchor: "body",
      onMount: (container: HTMLElement) => {
        const rootContainer = document.createElement("div");
        rootContainer.id = "reader-panel-root";
        container.appendChild(rootContainer);

        const root = createRoot(rootContainer);
        const element = (
          <TooltipProvider>
            <App article={article} />
          </TooltipProvider>
        );
        root.render(element);
      },
    });

    await ui.mount();
  }
}
