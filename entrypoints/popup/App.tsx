import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { storage } from "wxt/storage";
import type { StrictnessLevel } from "@/entrypoints/content/lib/types";

// Define storage items
const contentAnalysisEnabled = storage.defineItem<boolean>(
  "local:contentAnalysisEnabled",
  {
    fallback: true,
  }
);

const contentStrictness = storage.defineItem<StrictnessLevel>(
  "local:contentStrictness",
  {
    fallback: "medium",
  }
);

function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [strictness, setStrictness] = useState<StrictnessLevel>("medium");

  // Load initial settings when popup opens
  useEffect(() => {
    Promise.all([
      contentAnalysisEnabled.getValue(),
      contentStrictness.getValue(),
    ]).then(([enabled, strict]) => {
      setIsEnabled(enabled);
      setStrictness(strict);
    });
  }, []);

  async function updateSettings(updates: {
    enabled?: boolean;
    strictness?: StrictnessLevel;
  }) {
    const newEnabled = updates.enabled ?? isEnabled;
    const newStrictness = updates.strictness ?? strictness;

    // Save to storage
    await Promise.all([
      contentAnalysisEnabled.setValue(newEnabled),
      contentStrictness.setValue(newStrictness),
    ]);

    // Update local state
    setIsEnabled(newEnabled);
    setStrictness(newStrictness);

    // Notify content scripts of the change
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs[0]?.id) {
      await browser.tabs.sendMessage(tabs[0].id, {
        type: "SETTINGS_UPDATED",
        settings: {
          contentAnalysisEnabled: newEnabled,
          contentStrictness: newStrictness,
        },
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className="flex items-center justify-between">
        <span>Content Analysis</span>
        <Button
          onClick={() => updateSettings({ enabled: !isEnabled })}
          variant={isEnabled ? "default" : "secondary"}
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <span>Strictness Level</span>
        <Select
          value={strictness}
          onValueChange={(value: StrictnessLevel) =>
            updateSettings({ strictness: value })
          }
          disabled={!isEnabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select strictness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-gray-500 mt-2">
        {strictness === "low" && "More permissive filtering"}
        {strictness === "medium" && "Balanced filtering"}
        {strictness === "high" && "Strict content filtering"}
      </div>
    </div>
  );
}

export default App;
