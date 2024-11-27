import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { PromptConfig, PromptType } from "@/entrypoints/content/lib/types";
import { PromptManager } from "@/entrypoints/content/lib/ai/prompt";

interface PromptEditorProps {
  onSave: (config: PromptConfig) => void;
}

export function PromptEditor({ onSave }: PromptEditorProps) {
  const [currentView, setCurrentView] = useState<"A" | "B" | "C">("A");
  const [promptName, setPromptName] = useState("");
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [textC, setTextC] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleButtonA = async () => {
    try {
      setError(null);
      setIsGenerating(true);
      console.log("handleButtonA: ______________\n", promptName);
      if (!promptName.trim()) {
        setError("Please enter a prompt name");
        return;
      }
      const promptManager = new PromptManager();
      const prompts = await promptManager.generateCustomPrompts(textA);

      setTextB(prompts.systemPrompt);
      setTextC(prompts.safetyLevelPrompt);
      setCurrentView("B");
    } catch (error) {
      console.error("Error in handleButtonA:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleButtonB = () => {
    setCurrentView("C");
  };

  const handleButtonC = () => {
    setCurrentView("B");
  };

  const handleSave = () => {
    const config: PromptConfig = {
      name: promptName,
      systemPrompt: textB,
      safetyLevelPrompt: textC,
    };
    console.log("handleSave: ______________\n", promptName);
    onSave(config);
  };

  return (
    <div className="space-y-6 px-5">
      <div className="space-y-3">
        <Input
          value={promptName}
          onChange={(e) => setPromptName(e.target.value)}
          placeholder="Enter prompt name..."
          className="w-full"
        />
        <Textarea
          value={textA}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setTextA(e.target.value)
          }
          placeholder="Enter what you want to filter..."
          className="min-h-[170px] text-base"
        />
        {error && (
          <div className="text-red-500 text-sm mt-2">Error: {error}</div>
        )}
        <div className="flex space-x-4 pb-2 justify-end">
          <Button
            onClick={handleButtonA}
            className="px-6 btn-bordered"
            disabled={isGenerating || !textA.trim()}
          >
            {isGenerating ? "Generating..." : "Generate Custom Prompt"}
          </Button>
        </div>
      </div>

      {currentView !== "A" && (
        <div className="space-y-3">
          <Textarea
            value={currentView === "B" ? textB : textC}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              currentView === "B"
                ? setTextB(e.target.value)
                : setTextC(e.target.value)
            }
            placeholder={`${
              currentView === "B" ? "System Prompt" : "Safety Level Prompt"
            }`}
            className="min-h-[300px] h-[300px] text-base resize-none"
          />
          <div className="flex justify-between pb-2">
            <Button
              onClick={currentView === "B" ? handleButtonB : handleButtonC}
              className="px-6 btn-bordered"
            >
              {currentView === "B" ? "Next" : "Back"}
            </Button>
            <Button onClick={handleSave} className="px-6 btn-bordered">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
