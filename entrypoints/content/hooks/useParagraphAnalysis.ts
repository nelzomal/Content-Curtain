import { useState, useEffect } from "react";
import {
  ArticleContent,
  ParagraphWithSensitivity,
  SafetyAnalysisOptions,
} from "../lib/types";
import { analyzeContentSafetyBatch } from "../lib/ai/prompt";

export function useParagraphAnalysis(article: ArticleContent) {
  const [paragraphs, setParagraphs] = useState<ParagraphWithSensitivity[]>([]);

  useEffect(() => {
    const initializeParagraphs = () => {
      const div = document.createElement("div");
      div.innerHTML = article.content;

      return Array.from(div.getElementsByTagName("p"))
        .map((p) => p.outerHTML)
        .filter((html) => html.trim())
        .map((html, index) => ({
          id: `p-${index}`,
          content: html,
          isAnalyzing: false,
        }));
    };

    const analyzeParagraphs = async (
      initialParagraphs: ParagraphWithSensitivity[]
    ) => {
      const textsToAnalyze = initialParagraphs
        .map((p) => {
          return (
            new DOMParser()
              .parseFromString(p.content, "text/html")
              .body.textContent?.trim() || ""
          );
        })
        .filter((text) => text.length > 0);

      const options: SafetyAnalysisOptions = {
        batchSize: 2,
      };

      try {
        setParagraphs((current) =>
          current.map((p, idx) => ({
            ...p,
            isAnalyzing: idx < textsToAnalyze.length,
          }))
        );

        const analyzedIndices = new Set<number>();

        for await (const result of analyzeContentSafetyBatch(
          textsToAnalyze,
          options
        )) {
          const index = textsToAnalyze.findIndex(
            (text, idx) => text === result.text && !analyzedIndices.has(idx)
          );

          if (index !== -1) {
            analyzedIndices.add(index);
            setParagraphs((current) =>
              current.map((p, pIndex) =>
                pIndex === index
                  ? { ...p, sensitivity: result, isAnalyzing: false }
                  : p
              )
            );
          }
        }

        setParagraphs((current) =>
          current.map((p) => ({ ...p, isAnalyzing: false }))
        );
      } catch (error) {
        console.error("Error analyzing paragraphs:", error);
        setParagraphs((current) =>
          current.map((p) => ({ ...p, isAnalyzing: false }))
        );
      }
    };

    const initialParagraphs = initializeParagraphs();
    setParagraphs(initialParagraphs);
    analyzeParagraphs(initialParagraphs);
  }, [article.content]);

  return paragraphs;
}
