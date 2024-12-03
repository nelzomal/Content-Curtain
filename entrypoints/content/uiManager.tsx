import { createRoot } from "react-dom/client";
import { ContentScriptContext } from "wxt/client";
import { App } from "./app";
import { Article, TextBlock } from "./lib/types";
import {
  createBlurOverlay,
  showMessage,
  removeBlurOverlay,
} from "./lib/ui/overlay";

export class UIManager {
  private overlay: HTMLDivElement | null = null;
  private messageBox: HTMLDivElement | null = null;

  showError(message: string): void {
    this.overlay = createBlurOverlay();
    showMessage(this.overlay, {
      title: "Error",
      message,
      titleColor: "#e11d48",
    });
  }

  showContentWarning(message: string): void {
    const splitMessage = message
      .split(/(?<=[.!?]|\d)\s+|(?:explanation:)/i)
      .map((line) => line.trim())
      .filter((line) => line.length > 0); // Remove empty lines

    console.log("splitMessage", splitMessage);

    if (splitMessage.length > 1) {
      splitMessage.splice(1, 0, "Explanation:");
      splitMessage[0] = `<strong>${splitMessage[0]}</strong>`;
      splitMessage[1] = `<strong>${splitMessage[1]}</strong>`;
    }

    const remainingMessage = splitMessage.join("\n");
    console.log("remainingMessage", remainingMessage);
    this.overlay = createBlurOverlay();
    showMessage(this.overlay, {
      title: "Content Warning",
      message: remainingMessage || message,
      titleColor: "#f59e0b",
    });
  }

  showProcessing(title: string, message: string): void {
    this.overlay = createBlurOverlay();
    this.messageBox = showMessage(this.overlay, {
      title,
      message,
      titleColor: "#2563eb",
      showSpinner: true,
    });
  }

  hideProcessing(): void {
    if (this.overlay) {
      removeBlurOverlay(this.overlay);
      this.overlay = null;
      this.messageBox = null;
    }
  }

  async renderApp(
    ctx: ContentScriptContext,
    textBlocks: TextBlock[],
    performBlockAnalysis: boolean
  ) {
    const root = document.createElement("div");
    root.id = "extension-root";
    document.body.appendChild(root);

    createRoot(root).render(
      <App
        textBlocks={textBlocks}
        performBlockAnalysis={performBlockAnalysis}
      />
    );
  }
}
