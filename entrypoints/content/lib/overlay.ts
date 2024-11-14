interface MessageBoxOptions {
  title: string;
  message: string;
  titleColor?: string;
}

import { BLUR_OVERLAY_STYLES, MESSAGE_BOX_STYLES } from "./styles";

export function createBlurOverlay(): HTMLDivElement {
  const blurOverlay = document.createElement("div");
  blurOverlay.style.cssText = BLUR_OVERLAY_STYLES;
  document.body.appendChild(blurOverlay);
  return blurOverlay;
}

export function showMessage(
  overlay: HTMLDivElement,
  options: MessageBoxOptions
): void {
  const messageBox = document.createElement("div");
  messageBox.style.cssText = MESSAGE_BOX_STYLES;
  messageBox.innerHTML = `
    <h2 style="color: ${
      options.titleColor || "#e11d48"
    }; margin-bottom: 12px;">${options.title}</h2>
    <p style="color: #4b5563;">${options.message}</p>
  `;
  overlay.appendChild(messageBox);
}

export function removeBlurOverlay(overlay: HTMLDivElement): void {
  overlay.style.opacity = "0";
  setTimeout(() => overlay.remove(), 300);
}
