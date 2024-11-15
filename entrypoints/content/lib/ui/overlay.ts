interface MessageBoxOptions {
  title: string;
  message: string;
  titleColor?: string;
  showSpinner?: boolean;
}

interface ToastOptions {
  message: string;
  duration?: number;
  type?: "success" | "warning" | "error";
}

import {
  BLUR_OVERLAY_STYLES,
  MESSAGE_BOX_STYLES,
  SPINNER_STYLES,
  GLOBAL_STYLES,
} from "../styles";

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

export function showToast(options: ToastOptions): HTMLDivElement {
  const toast = document.createElement("div");

  // Define colors based on type
  const colors = {
    success: {
      bg: "#10b981", // green
      text: "#ffffff",
    },
    warning: {
      bg: "#fbbf24", // yellow
      text: "#1f2937",
    },
    error: {
      bg: "#ef4444", // red
      text: "#ffffff",
    },
  };

  const { bg, text } = colors[options.type || "success"];

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${bg};
    color: ${text};
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 999999;
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    font-weight: 500;
  `;

  toast.textContent = options.message;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  // Auto remove after duration
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, options.duration || 3000);

  return toast;
}
