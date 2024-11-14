interface MessageBoxOptions {
  title: string;
  message: string;
  titleColor?: string;
}

export function createBlurOverlay(): HTMLDivElement {
  const blurOverlay = document.createElement("div");
  blurOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.5);
    z-index: 2147483647;
    transition: opacity 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  document.body.appendChild(blurOverlay);
  return blurOverlay;
}

export function showMessage(
  overlay: HTMLDivElement,
  options: MessageBoxOptions
): void {
  const messageBox = document.createElement("div");
  messageBox.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    max-width: 80%;
    text-align: center;
  `;
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
