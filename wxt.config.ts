import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "NSFW Content Blocker",
    description: "A Chrome extension to hide NSFW content online",
    version: "1.0.0",
    permissions: ["storage"],
  },
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
});
