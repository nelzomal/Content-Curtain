import { normalizeText } from "../utils";
import { analyzeContentSafety } from "./prompt";
import { Article, AnalysisResult } from "../types";

export async function analyzeContent(
  content: Article | null
): Promise<AnalysisResult> {
  try {
    if (!content) {
      return {
        article: null,
        error: {
          type: "EXTRACTION_FAILED",
          message: "Could not extract content from this page",
        },
      };
    }

    content.textContent = normalizeText(content.textContent);
    const safetyAnalysis = await analyzeContentSafety(content.textContent);

    return {
      article: content,
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
