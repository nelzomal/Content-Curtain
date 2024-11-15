import { useCallback, useEffect, useState } from "react";
import { TextBlock, SafetyAnalysis } from "../types";
import { analyzeContentSafety } from "../ai/prompt";
import { createTooltip } from "./overlay";

export const useTooltip = () => {
  const showExplanationTooltip = useCallback(
    (block: TextBlock, analysis?: SafetyAnalysis) => {
      if (!analysis?.explanation) {
        return;
      }

      const tooltip = createTooltip(analysis.explanation);
      let isTooltipVisible = false;

      const showTooltip = (e: MouseEvent) => {
        if (!isTooltipVisible) {
          const tooltipLeft = Math.min(
            e.clientX + 5,
            window.innerWidth - tooltip.offsetWidth - 5
          );
          const tooltipTop = Math.min(
            e.clientY - tooltip.offsetHeight - 5,
            window.innerHeight - tooltip.offsetHeight - 5
          );

          tooltip.style.display = "block";
          tooltip.style.left = `${tooltipLeft}px`;
          tooltip.style.top = `${tooltipTop}px`;
          isTooltipVisible = true;
        } else {
          const tooltipLeft = Math.min(
            e.clientX + 5,
            window.innerWidth - tooltip.offsetWidth - 5
          );
          const tooltipTop = Math.min(
            e.clientY - tooltip.offsetHeight - 5,
            window.innerHeight - tooltip.offsetHeight - 5
          );

          tooltip.style.left = `${tooltipLeft}px`;
          tooltip.style.top = `${tooltipTop}px`;
        }
      };

      const hideTooltip = () => {
        tooltip.style.display = "none";
        isTooltipVisible = false;
      };

      block.nodes?.forEach((node) => {
        if (node.parentElement) {
          node.parentElement.style.cursor = "help";
          node.parentElement.addEventListener("mouseover", showTooltip);
          node.parentElement.addEventListener("mousemove", showTooltip);
          node.parentElement.addEventListener("mouseout", hideTooltip);
        }
      });
    },
    []
  );

  return { showExplanationTooltip };
};

export const useBlur = () => {
  const toggleBlur = useCallback((block: TextBlock, shouldBlur: boolean) => {
    block.nodes?.forEach((node) => {
      if (node.parentElement) {
        node.parentElement.style.filter = shouldBlur ? "blur(4px)" : "";
        node.parentElement.style.transition = shouldBlur
          ? "filter 0.3s ease"
          : "";
      }
    });
  }, []);

  return { toggleBlur };
};

export const useContentAnalysis = (
  textBlocks: TextBlock[],
  performBlockAnalysis: boolean
) => {
  const [analyzedBlocks, setAnalyzedBlocks] = useState<
    Map<number, SafetyAnalysis>
  >(new Map());

  const { showExplanationTooltip } = useTooltip();
  const { toggleBlur } = useBlur();

  const analyzeSingleBlock = useCallback(
    async (block: TextBlock) => {
      try {
        const analysis = await analyzeContentSafety(block.text);

        setAnalyzedBlocks((prev) => {
          const newMap = new Map(prev);
          newMap.set(block.index, analysis);
          return newMap;
        });
        console.log(analysis);
        if (analysis.safetyLevel === "too sensitive") {
          showExplanationTooltip(block, analysis);
        } else {
          toggleBlur(block, false);
        }
      } catch (error) {
        throw error;
      }
    },
    [showExplanationTooltip]
  );

  useEffect(() => {
    if (!performBlockAnalysis) {
      return;
    }

    const longBlocks = textBlocks.filter((block) => block.text.length > 100);

    // Initially blur all long blocks
    longBlocks.forEach((block) => toggleBlur(block, true));

    const parallelism = 8;
    const analyzeBlocks = async () => {
      const pending = [...longBlocks];
      const inProgress = new Set<Promise<void>>();

      while (pending.length > 0 || inProgress.size > 0) {
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

        if (inProgress.size > 0) {
          await Promise.race(inProgress);
        }
      }
    };

    analyzeBlocks().catch(console.error);

    return () => {
      textBlocks.forEach((block) => toggleBlur(block, false));
    };
  }, [textBlocks, performBlockAnalysis, analyzeSingleBlock, toggleBlur]);

  return { analyzedBlocks };
};
