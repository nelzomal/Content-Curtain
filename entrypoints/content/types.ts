import { SensitivityAnalysis } from "./lib/ai";

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
