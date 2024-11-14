import { Readability } from "@mozilla/readability";
import { normalizeText } from "./utils";
import { analyzeContentSafety } from "./ai";

export interface Article {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
}

export interface AnalysisResult {
  article: Article | null;
  safetyAnalysis?: {
    safetyLevel: "safe" | "too sensitive" | "OK";
    explanation: string;
  };
  error?: {
    type: "EXTRACTION_FAILED" | "ANALYSIS_FAILED";
    message: string;
  };
}

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