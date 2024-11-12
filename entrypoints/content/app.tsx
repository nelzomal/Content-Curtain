import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <Card className="fixed top-5 right-5 w-[400px] max-h-[90vh] z-[2147483647]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{article.title || "Untitled"}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Site: {article.siteName || "Unknown"} • Length: {article.length} chars
        </p>
      </CardHeader>
      <ScrollArea className="h-full max-h-[calc(90vh-120px)]">
        <CardContent>
          {paragraphs.map((paragraph) => (
            <div key={paragraph.id} className="relative mb-6">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: paragraph.content }}
              />
              {paragraph.isAnalyzing ? (
                <div className="text-sm italic text-muted-foreground mt-1 animate-pulse">
                  Analyzing...
                </div>
              ) : paragraph.sensitivity ? (
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={`inline-flex px-2 py-1 text-xs rounded mt-1 ${getSensitivityClass(
                        paragraph.sensitivity.sensitivityLevel
                      )}`}
                    >
                      Sensitivity: {paragraph.sensitivity.sensitivityLevel}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[300px] text-sm">
                      {paragraph.sensitivity.explanation}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

// Helper function to get sensitivity classes
function getSensitivityClass(level: number): string {
  const baseLevel = Math.floor(level / 20);
  switch (baseLevel) {
    case 0:
      return "bg-green-100 text-green-800";
    case 1:
      return "bg-orange-100 text-orange-800";
    case 2:
      return "bg-red-100 text-red-800";
    case 3:
      return "bg-orange-100 text-orange-800";
    case 4:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
