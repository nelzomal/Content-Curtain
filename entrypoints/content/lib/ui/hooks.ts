import { useCallback, useEffect, useState } from "react";
import { TextBlock, SafetyAnalysis } from "../types";
import { analyzeContentSafety } from "../ai/prompt";
import { createTooltip, showAnalysisToast } from "./overlay";
import React from "react";

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
  const toastRef = React.useRef<HTMLDivElement | null>(null);
  const { showExplanationTooltip } = useTooltip();
  const { toggleBlur } = useBlur();

  const analyzeSingleBlock = useCallback(
    async (block: TextBlock) => {
      try {
        const analysis = await analyzeContentSafety(block.text);

        if (analysis.safetyLevel === "too sensitive") {
          showExplanationTooltip(block, analysis);
        } else {
          toggleBlur(block, false);
        }
      } catch (error) {
        throw error;
      }
    },
    [showExplanationTooltip, toggleBlur]
  );

  useEffect(() => {
    if (!performBlockAnalysis) {
      return;
    }

    const longBlocks = textBlocks.filter((block) => block.text.length > 100);
    longBlocks.forEach((block) => toggleBlur(block, true));

    const total = longBlocks.length;
    let completed = 0;
    toastRef.current = showAnalysisToast(total);

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
              completed++;
              if (toastRef.current) {
                toastRef.current.textContent = `Analyzing paragraph safety levels... (${completed}/${total})`;
              }
              if (completed === total) {
                setTimeout(() => {
                  if (toastRef.current) {
                    toastRef.current.style.opacity = "0";
                    setTimeout(() => toastRef.current?.remove(), 300);
                  }
                }, 1000);
              }
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
      longBlocks.forEach((block) => toggleBlur(block, false));
    };
  }, [textBlocks, performBlockAnalysis, analyzeSingleBlock, toggleBlur]);
};
