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
import type {
  StrictnessLevel,
  PromptType,
} from "@/entrypoints/content/lib/types";

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

const activePromptType = storage.defineItem<PromptType>(
  "local:activePromptType",
  {
    fallback: "nsfw",
  }
);

function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [strictness, setStrictness] = useState<StrictnessLevel>("medium");
  const [promptType, setPromptType] = useState<PromptType>("nsfw");

  // Load initial settings when popup opens
  useEffect(() => {
    Promise.all([
      contentAnalysisEnabled.getValue(),
      contentStrictness.getValue(),
      activePromptType.getValue(),
    ]).then(([enabled, strict, type]) => {
      setIsEnabled(enabled);
      setStrictness(strict);
      setPromptType(type);
    });
  }, []);

  async function updateSettings(updates: {
    enabled?: boolean;
    strictness?: StrictnessLevel;
    promptType?: PromptType;
  }) {
    const newEnabled = updates.enabled ?? isEnabled;
    const newStrictness = updates.strictness ?? strictness;
    const newPromptType = updates.promptType ?? promptType;

    // Save to storage
    await Promise.all([
      contentAnalysisEnabled.setValue(newEnabled),
      contentStrictness.setValue(newStrictness),
      activePromptType.setValue(newPromptType),
    ]);

    // Update local state
    setIsEnabled(newEnabled);
    setStrictness(newStrictness);
    setPromptType(newPromptType);

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
          activePromptType: newPromptType,
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
        <span>Filter Type</span>
        <Select
          value={promptType}
          onValueChange={(value: PromptType) =>
            updateSettings({ promptType: value })
          }
          disabled={!isEnabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nsfw">NSFW Filter</SelectItem>
            <SelectItem value="sportsSpoiler">Sports Spoilers</SelectItem>
            <SelectItem value="generalSpoiler">Story Spoilers</SelectItem>
          </SelectContent>
        </Select>
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
        {promptType === "nsfw" && (
          <>
            {strictness === "low" && "More permissive content filtering"}
            {strictness === "medium" && "Balanced content filtering"}
            {strictness === "high" && "Strict content filtering"}
          </>
        )}
        {promptType === "sportsSpoiler" && (
          <>
            {strictness === "low" && "Only major game results"}
            {strictness === "medium" && "Game results and key moments"}
            {strictness === "high" && "All sports-related spoilers"}
          </>
        )}
        {promptType === "generalSpoiler" && (
          <>
            {strictness === "low" && "Only major plot twists"}
            {strictness === "medium" && "Important story revelations"}
            {strictness === "high" && "All potential spoilers"}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
