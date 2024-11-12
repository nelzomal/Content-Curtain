import { Readability } from "@mozilla/readability";
import "./content/style.css";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Create a clone of the document since Readability modifies it
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article) {
      console.log("Could not extract content from this page");
      return;
    }

    // Create shadow root UI
    const ui = await createShadowRootUi(ctx, {
      name: "reader-panel",
      position: "inline",
      anchor: "body",
      onMount: (container: HTMLElement) => {
        const panel = document.createElement("div");
        panel.className = "reader-panel";

        const title = document.createElement("div");
        title.className = "reader-title";
        title.textContent = article.title || "Untitled";

        const meta = document.createElement("div");
        meta.className = "reader-meta";
        meta.textContent = `Site: ${article.siteName || "Unknown"} • Length: ${
          article.length
        } chars`;

        const content = document.createElement("div");
        content.className = "reader-content";
        content.innerHTML = article.content;

        panel.appendChild(title);
        panel.appendChild(meta);
        panel.appendChild(content);
        container.appendChild(panel);
      },
    });

    // Mount the UI
    ui.mount();
  },
});
