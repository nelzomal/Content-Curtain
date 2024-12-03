# ContentCurtain 🎭

Take control of your browsing experience with ContentCurtain! This powerful Chrome extension empowers you to filter and hide sensitive or unwanted text on webpages, creating a more focused and mindful online environment. Whether you’re avoiding sports spoilers, filtering NSFW content, or tailoring web content to your preferences, ContentCurtain lets you customize what you see.

## Features ✨

- **Smart Content Analysis**: Automatically analyzes webpage content to determine sensitivity levels
- **Granular Filtering**: Semantically divides content into blocks for precise filtering
- **Customizable Settings**:
  - Enable/disable filters
  - Adjust strictness levels
  - Create personalized filter types
- **Real-time Feedback**: Clear notifications about content safety
- **Privacy-First**: All content analysis happens locally

## How It Works 🔍

ContentCurtain processes webpage content in three ways:

1. **Safe Content**: Displays a notification confirming the page is safe to view
2. **Sensitive Content**: Shows a full-screen banner explaining why the content may be unsuitable
3. **Mixed Content**:
   - Divides content into paragraph blocks
   - Initially blurs all blocks
   - Analyzes each block individually
   - Reveals only blocks meeting user-defined sensitivity criteria

## Installation 🚀

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/content-curtain.git
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the extension:

   ```bash
   pnpm build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Built with [WXT](https://wxt.dev)
- UI components from [Shadcn/UI](https://ui.shadcn.com)
- Content extraction powered by [Mozilla Readability](https://github.com/mozilla/readability)

## Support 💪

If you find this project useful, please consider giving it a ⭐️ on GitHub!

---

Made with ❤️ for a safer browsing experience
