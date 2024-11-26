import { Button } from "@/components/ui/button.tsx";
import { useState, useEffect } from "react";
import { storage } from "wxt/storage";

// Define the storage item
const contentAnalysisEnabled = storage.defineItem<boolean>(
  "local:contentAnalysisEnabled",
  {
    fallback: true, // Default to enabled
  }
);

function App() {
  const [isEnabled, setIsEnabled] = useState(false);

  // Load initial setting when popup opens
  useEffect(() => {
    contentAnalysisEnabled.getValue().then((value) => {
      setIsEnabled(value);
    });
  }, []);

  async function updateSettings() {
    // Toggle the setting
    const newValue = !isEnabled;

    // Save to storage
    await contentAnalysisEnabled.setValue(newValue);

    // Update local state
    setIsEnabled(newValue);

    // Notify content scripts of the change
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tabs[0]?.id) {
      await browser.tabs.sendMessage(tabs[0].id, {
        type: "SETTINGS_UPDATED",
        settings: { contentAnalysisEnabled: newValue },
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4">
      <div className="flex items-center justify-between">
        <span>Content Analysis</span>
        <Button
          onClick={updateSettings}
          variant={isEnabled ? "default" : "secondary"}
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </Button>
      </div>
    </div>
  );
}

export default App;
