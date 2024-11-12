import React from "react";

interface ArticleContent {
  title: string;
  siteName: string;
  length: number;
  content: string;
}

interface AppProps {
  article: ArticleContent;
}

export const App: React.FC<AppProps> = ({ article }) => {
  return (
    <div className="reader-panel">
      <div className="reader-title">{article.title || "Untitled"}</div>
      <div className="reader-meta">
        Site: {article.siteName || "Unknown"} • Length: {article.length} chars
      </div>
      <div
        className="reader-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
};
