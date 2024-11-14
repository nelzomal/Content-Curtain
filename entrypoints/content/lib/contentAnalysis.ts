import { Readability } from "@mozilla/readability";
import { normalizeText } from "./utils";
import { analyzeContentSafety } from "./ai/prompt";
import { Article, AnalysisResult } from "./types";

export async function analyzeContent(): Promise<AnalysisResult> {
  try {
    const article = await extractArticle();
    if (!article) {
      return {
        article: null,
        error: {
          type: "EXTRACTION_FAILED",
          message: "Could not extract content from this page",
        },
      };
    }

    article.textContent = normalizeText(article.textContent);
    const safetyAnalysis = await analyzeContentSafety(article.textContent);

    return {
      article,
      safetyAnalysis,
    };
  } catch (error) {
    return {
      article: null,
      error: {
        type: "ANALYSIS_FAILED",
        message: "An error occurred while analyzing the content",
      },
    };
  }
}

function extractArticle(): Article | null {
  const documentClone = document.cloneNode(true) as Document;
  const reader = new Readability(documentClone);
  return reader.parse();
}
