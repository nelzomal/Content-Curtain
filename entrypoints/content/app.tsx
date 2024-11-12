import React, { useEffect, useState } from "react";
import { analyzeSensitivity, SensitivityAnalysis } from "./services/ai";

interface ArticleContent {
  title: string;
  siteName: string;
  length: number;
  content: string;
}

interface AppProps {
  article: ArticleContent;
}

interface ParagraphWithSensitivity {
  id: string;
  content: string;
  sensitivity?: SensitivityAnalysis;
  isAnalyzing: boolean;
}

export const App: React.FC<AppProps> = ({ article }) => {
  const [paragraphs, setParagraphs] = useState<ParagraphWithSensitivity[]>([]);

  useEffect(() => {
    // Create a temporary div to parse HTML content
    const div = document.createElement("div");
    div.innerHTML = article.content;

    // Initialize paragraphs array
    const initialParagraphs = Array.from(div.getElementsByTagName("p"))
      .map((p) => p.outerHTML)
      .filter((html) => html.trim())
      .map((html, index) => ({
        id: `p-${index}`,
        content: html,
        isAnalyzing: false,
      }));

    setParagraphs(initialParagraphs);

    // Analyze paragraphs one by one
    const analyzeParagraph = async (index: number) => {
      if (index >= initialParagraphs.length) return;

      // Mark paragraph as analyzing
      setParagraphs((current) =>
        current.map((p, i) => (i === index ? { ...p, isAnalyzing: true } : p))
      );

      const p = initialParagraphs[index];
      const text = new DOMParser()
        .parseFromString(p.content, "text/html")
        .body.textContent?.trim();

      if (text) {
        try {
          const sensitivity = await analyzeSensitivity(text);

          // Update paragraph with sensitivity result
          setParagraphs((current) =>
            current.map((p, i) =>
              i === index ? { ...p, sensitivity, isAnalyzing: false } : p
            )
          );
        } catch (error) {
          console.error(`Error analyzing paragraph ${index}:`, error);
          // Mark paragraph as not analyzing in case of error
          setParagraphs((current) =>
            current.map((p, i) =>
              i === index ? { ...p, isAnalyzing: false } : p
            )
          );
        }
      }

      // Analyze next paragraph
      analyzeParagraph(index + 1);
    };

    // Start analyzing from the first paragraph
    analyzeParagraph(0);
  }, [article.content]);

  return (
    <div className="reader-panel">
      <div className="reader-title">{article.title || "Untitled"}</div>
      <div className="reader-meta">
        Site: {article.siteName || "Unknown"} • Length: {article.length} chars
      </div>
      <div className="reader-content">
        {paragraphs.map((paragraph) => (
          <div key={paragraph.id} className="paragraph-container">
            <div
              className="paragraph-content"
              dangerouslySetInnerHTML={{ __html: paragraph.content }}
            />
            {paragraph.isAnalyzing ? (
              <div className="sensitivity-loading">Analyzing...</div>
            ) : paragraph.sensitivity ? (
              <div
                className={`sensitivity-indicator level-${Math.floor(
                  paragraph.sensitivity.sensitivityLevel / 20
                )}`}
              >
                Sensitivity: {paragraph.sensitivity.sensitivityLevel}%
                <div className="sensitivity-explanation">
                  {paragraph.sensitivity.explanation}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
