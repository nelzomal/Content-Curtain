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
  PromptConfig,
  Settings,
} from "@/entrypoints/content/lib/types";
import {
  DEFAULT_PROMPTS,
  DEFAULT_SETTINGS,
} from "@/entrypoints/content/lib/constant";
import { PromptEditor } from "./components/PromptEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterDropdown } from "./components/FilterDropdown";
import { checkPromptCapability, PromptManager } from "../content/lib/ai/prompt";
import { checkWriterCapability } from "../content/lib/ai/write";

// Define storage items
const settings = storage.defineItem<Settings>("local:settings", {
  fallback: DEFAULT_SETTINGS,
});

function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [strictness, setStrictness] = useState<StrictnessLevel>("medium");
  const [promptType, setPromptType] = useState<PromptType>("nsfw");
  const [currentPrompts, setCurrentPrompts] =
    useState<Record<PromptType, PromptConfig>>(DEFAULT_PROMPTS);
  const [activeTab, setActiveTab] = useState("settings");
  const [canPrompt, setCanPrompt] = useState<boolean | null>(null);
  const [canWrite, setCanWrite] = useState<boolean | null>(null);

  useEffect(() => {
    const checkCapability = async () => {
      const promptResult = await checkPromptCapability();

      setCanPrompt(promptResult);
      const writerResult = await checkWriterCapability();
      setCanWrite(writerResult);
    };
    checkCapability();
  }, []);

  // Load initial settings when popup opens
  useEffect(() => {
    Promise.all([settings.getValue()]).then(([settings]) => {
      console.log("App: ______________\n", settings);
      setIsEnabled(settings.contentAnalysisEnabled);
      setStrictness(settings.contentStrictness);
      setPromptType(settings.activePromptType);
      setCurrentPrompts(settings.customPrompts);
    });
  }, []);

  async function updateSettings(updates: {
    enabled?: boolean;
    strictness?: StrictnessLevel;
    promptType?: PromptType;
    customPrompts?: Record<PromptType, PromptConfig>;
  }) {
    console.log("updateSettings: ______________\n", updates);
    const newEnabled = updates.enabled ?? isEnabled;
    const newStrictness = updates.strictness ?? strictness;
    const newPromptType = updates.promptType ?? promptType;
    const newCustomPrompts = updates.customPrompts ?? currentPrompts;

    // Save to storage
    await Promise.all([
      settings.setValue({
        contentAnalysisEnabled: newEnabled,
        contentStrictness: newStrictness,
        activePromptType: newPromptType,
        customPrompts: newCustomPrompts,
      }),
    ]);

    // Update local state
    setIsEnabled(newEnabled);
    setStrictness(newStrictness);
    setPromptType(newPromptType);
    setCurrentPrompts(newCustomPrompts);
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
          customPrompts: newCustomPrompts,
        },
      });
    }
  }

  const handleSavePrompt = async (config: PromptConfig) => {
    console.log("handleSavePrompt: ______________\n", config.name!);
    // Update the prompts with the new config
    const updatedPrompts = {
      ...currentPrompts,
      [config.name!]: config,
    };

    updateSettings({
      customPrompts: updatedPrompts,
      promptType: config.name!,
    });
  };

  return canPrompt && canWrite ? (
    <div className="min-h-[300px] -mt-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 relative">
          <TabsTrigger
            value="settings"
            className="px-3 pt-0 text-sm font-medium transition-colors relative data-[state=active]:text-foreground data-[state=inactive]:opacity-50 after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[1px] after:transition-all data-[state=active]:after:bg-white data-[state=inactive]:after:bg-transparent hover:bg-transparent"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="customize"
            className="px-3 pt-0 text-sm font-medium transition-colors relative data-[state=active]:text-foreground data-[state=inactive]:opacity-50 after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[1px] after:transition-all data-[state=active]:after:bg-white data-[state=inactive]:after:bg-transparent hover:bg-transparent"
          >
            Customize Filter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="-mt-3">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Full Page Filter</span>
              <Button
                onClick={() => updateSettings({ enabled: !isEnabled })}
                variant={isEnabled ? "default" : "secondary"}
                className="btn-bordered"
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filter Type</span>
              <FilterDropdown
                prompts={currentPrompts}
                activePromptType={promptType}
                disabled={false}
                onSelect={(prompt) => {
                  updateSettings({ promptType: prompt.name });
                }}
                onRemove={(name) => {
                  const updatedPrompts = { ...currentPrompts };
                  delete updatedPrompts[name];

                  // If we're removing the active prompt, switch to another available prompt
                  // or default to 'nsfw' if no other prompts exist
                  const updates: {
                    customPrompts: typeof updatedPrompts;
                    promptType?: PromptType;
                  } = {
                    customPrompts: updatedPrompts,
                  };

                  if (name === promptType) {
                    // Get the first available prompt name or default to 'nsfw'
                    const newPromptType =
                      Object.keys(updatedPrompts)[0] || "nsfw";
                    updates.promptType = newPromptType as PromptType;
                  }

                  updateSettings(updates);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Strictness Level</span>
              <Select
                value={strictness}
                onValueChange={(value: StrictnessLevel) =>
                  updateSettings({ strictness: value })
                }
                disabled={false}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select strictness" />
                </SelectTrigger>
                <SelectContent className="w-[180px]">
                  <SelectItem value="low">Relexed</SelectItem>
                  <SelectItem value="medium">Balanced</SelectItem>
                  <SelectItem value="high">Strict</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-500 text-right">
              {promptType === "nsfw" && (
                <>
                  {strictness === "low" && "More permissive content filtering"}
                  {strictness === "medium" && "Balanced content filtering"}
                  {strictness === "high" && "Strict content filtering"}
                </>
              )}
              {promptType === "sports spoiler" && (
                <>
                  {strictness === "low" && "Only major game results"}
                  {strictness === "medium" && "Game results and key moments"}
                  {strictness === "high" && "All sports-related spoilers"}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customize" className="pt-1">
          <div>
            <PromptEditor
              onSave={(config) => {
                // existing save logic
                handleSavePrompt(config);
              }}
              onClose={() => {
                // Switch back to settings tab
                setActiveTab("settings"); // Assuming you have this state for tab management
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ) : (
    <div className="flex flex-col gap-4 items-center justify-center h-full text-center p-4">
      {!canPrompt && (
        <p className="text-red-500">
          The Chrome Prompt AI feature is not enabled. Please{" "}
          <a
            href="https://developer.chrome.com/docs/extensions/ai/prompt-api"
            className="text-blue-500 hover:text-blue-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            click here
          </a>{" "}
          to learn how to enable it.
        </p>
      )}
      {!canWrite && (
        <p className="text-red-500">
          The Chrome Writer AI feature is not enabled. Please{" "}
          <a
            href="https://developer.chrome.com/docs/extensions/ai/"
            className="text-blue-500 hover:text-blue-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            click here
          </a>{" "}
          to learn how to enable it.
        </p>
      )}
    </div>
  );
}

export default App;
