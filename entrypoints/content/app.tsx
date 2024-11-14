import React, { useEffect, useState } from "react";
import { TextBlock, SafetyAnalysis } from "./lib/types";
import { analyzeContentSafety } from "./lib/ai/prompt";

interface AppProps {
  textBlocks: TextBlock[];
}

export const App: React.FC<AppProps> = ({ textBlocks }) => {
  const [analyzedBlocks, setAnalyzedBlocks] = useState<
    Map<number, SafetyAnalysis>
  >(new Map());

  const toggleBlur = (block: TextBlock, shouldBlur: boolean) => {
    block.nodes?.forEach((node) => {
      if (node.parentElement) {
        node.parentElement.style.filter = shouldBlur ? "blur(4px)" : "";
        node.parentElement.style.transition = shouldBlur
          ? "filter 0.3s ease"
          : "";
      }
    });
  };

  const analyzeSingleBlock = async (block: TextBlock) => {
    try {
      const analysis = await analyzeContentSafety(block.text);
      setAnalyzedBlocks((prev) => new Map(prev).set(block.index, analysis));

      if (analysis.safetyLevel !== "too sensitive") {
        toggleBlur(block, false);
      }
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const longBlocks = textBlocks.filter((block) => block.text.length > 100);

    // Initially blur all long blocks
    longBlocks.forEach((block) => toggleBlur(block, true));

    const parallelism = 8;
    const analyzeBlocks = async () => {
      const pending = [...longBlocks];
      const inProgress = new Set<Promise<void>>();

      while (pending.length > 0 || inProgress.size > 0) {
        // Fill up to parallelism limit
        while (inProgress.size < parallelism && pending.length > 0) {
          const block = pending.shift()!;
          const promise = analyzeSingleBlock(block)
            .catch(() => {
              pending.push(block);
            })
            .finally(() => {
              inProgress.delete(promise);
            });

          inProgress.add(promise);
        }

        // Wait for at least one promise to complete before next iteration
        if (inProgress.size > 0) {
          await Promise.race(inProgress);
        }
      }
    };

    analyzeBlocks().catch(console.error);

    // Cleanup
    return () => {
      textBlocks.forEach((block) => toggleBlur(block, false));
    };
  }, [textBlocks]);

  return <div></div>;
};
