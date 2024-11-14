import React from "react";
import { AppProps } from "./lib/types";
import { useParagraphAnalysis } from "./hooks/useParagraphAnalysis";
import { ArticleCard } from "@/entrypoints/content/components/article/ArticleCard";

export const App: React.FC<AppProps> = ({ article }) => {
  const paragraphs = useParagraphAnalysis(article);

  return (
    <div>
      <ArticleCard article={article} paragraphs={paragraphs} />
    </div>
  );
};
