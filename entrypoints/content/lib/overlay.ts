interface MessageBoxOptions {
  title: string;
  message: string;
  titleColor?: string;
  showSpinner?: boolean;
}

import {
  BLUR_OVERLAY_STYLES,
  MESSAGE_BOX_STYLES,
  SPINNER_STYLES,
  GLOBAL_STYLES,
} from "./styles";

function injectGlobalStyles() {
  const styleEl = document.createElement("style");
  styleEl.textContent = GLOBAL_STYLES;
  document.head.appendChild(styleEl);
  return styleEl;
}

export function createBlurOverlay(): HTMLDivElement {
  const blurOverlay = document.createElement("div");
  blurOverlay.style.cssText = BLUR_OVERLAY_STYLES;
  document.body.appendChild(blurOverlay);
  return blurOverlay;
}

export function showMessage(
  overlay: HTMLDivElement,
  options: MessageBoxOptions
): HTMLDivElement {
  const messageBox = document.createElement("div");
  messageBox.style.cssText = MESSAGE_BOX_STYLES;

  let spinnerHtml = "";
  let styleEl: HTMLStyleElement | null = null;

  if (options.showSpinner) {
    styleEl = injectGlobalStyles();
    spinnerHtml = `<div class="spinner" style="${SPINNER_STYLES}"></div>`;
  }

  messageBox.innerHTML = `
    ${spinnerHtml}
    <h2 style="color: ${
      options.titleColor || "#e11d48"
    }; margin-bottom: 12px;">${options.title}</h2>
    <p style="color: #4b5563;">${options.message}</p>
  `;

  overlay.appendChild(messageBox);

  // Store the style element reference on the messageBox for cleanup
  if (styleEl) {
    (messageBox as any)._styleEl = styleEl;
  }

  return messageBox;
}

export function removeBlurOverlay(
  overlay: HTMLDivElement,
  immediate = false
): void {
  // Clean up the injected styles if they exist
  const messageBox = overlay.querySelector("div");
  if (messageBox && (messageBox as any)._styleEl) {
    (messageBox as any)._styleEl.remove();
  }

  overlay.style.opacity = "0";
  setTimeout(() => overlay.remove(), immediate ? 0 : 300);
}
