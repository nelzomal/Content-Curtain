// Content safety analysis types
export type ContentSafetyLevel = "safe" | "too sensitive" | "moderate";

export interface SafetyAnalysis {
  text: string;
  safetyNumber: number; // 0-10 scale
  safetyLevel?: ContentSafetyLevel;
  explanation?: string;
}

export interface SafetyAnalysisOptions {
  batchSize?: number;
  strictness?: StrictnessLevel;
}

export interface ContentSafetyAnalysis {
  text: string;
  safetyLevel: ContentSafetyLevel;
  explanation?: string;
}

export interface AnalysisResult {
  article: Article | null;
  safetyAnalysis?: SafetyAnalysis;
  error?: {
    type: "EXTRACTION_FAILED" | "ANALYSIS_FAILED";
    message: string;
  };
}

// Article related types
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

export interface ArticleContent extends Article {
  parsedBlocks?: string[];
}

// UI Component types
export interface TextBlock {
  text: string;
  index: number;
  nodes?: Node[];
}

// Add these new types
export type StrictnessLevel = "low" | "medium" | "high";
