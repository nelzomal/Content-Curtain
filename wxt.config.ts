import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "Content Curtain",
    description:
      "Take control of your browsing experience with ContentCurtain! This powerful Chrome extension empowers you to filter and hide sensitive or unwanted text on webpages, creating a more focused and mindful online environment. Whether you’re avoiding sports spoilers, filtering NSFW content, or tailoring web content to your preferences, ContentCurtain lets you customize what you see.",
    version: "0.0.1",
    permissions: ["storage"],
  },
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
});
