export interface SensitivityAnalysis {
  text: string;
  sensitivityLevel: number; // 0-10 scale
  explanation?: string;
}

export interface SensitivityAnalysisOptions {
  batchSize?: number;
}

export type ContentSafetyLevel = "safe" | "too sensitive" | "OK";

export interface ContentSafetyAnalysis {
  text: string;
  safetyLevel: ContentSafetyLevel;
  explanation?: string;
}

export interface SafetyAnalysis {
  safetyLevel: ContentSafetyLevel;
  explanation: string;
}

export interface ArticleContent {
  title: string;
  siteName: string;
  length: number;
  content: string;
}

export interface ParagraphWithSensitivity {
  id: string;
  content: string;
  sensitivity?: SensitivityAnalysis;
  isAnalyzing: boolean;
}

export interface AppProps {
  article: ArticleContent;
}

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
    safetyLevel: ContentSafetyLevel;
    explanation: string;
  };
  error?: {
    type: "EXTRACTION_FAILED" | "ANALYSIS_FAILED";
    message: string;
  };
}
