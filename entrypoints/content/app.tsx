import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  analyzeSensitivityBatch,
  SensitivityAnalysis,
  SensitivityAnalysisOptions,
} from "./services/ai";

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

    // Analyze paragraphs in batches
    const analyzeParagraphs = async () => {
      // Extract text content from paragraphs
      const textsToAnalyze = initialParagraphs
        .map((p) => {
          return (
            new DOMParser()
              .parseFromString(p.content, "text/html")
              .body.textContent?.trim() || ""
          );
        })
        .filter((text) => text.length > 0);

      // Mark all paragraphs as analyzing
      setParagraphs((current) =>
        current.map((p) => ({ ...p, isAnalyzing: true }))
      );

      try {
        const options: SensitivityAnalysisOptions = {
          batchSize: 2,
        };

        const results = await analyzeSensitivityBatch(textsToAnalyze, options);

        // Update all paragraphs with their sensitivity results
        setParagraphs((current) =>
          current.map((p, index) => ({
            ...p,
            sensitivity: results[index],
            isAnalyzing: false,
          }))
        );
      } catch (error) {
        console.error("Error analyzing paragraphs:", error);
        // Mark all paragraphs as not analyzing in case of error
        setParagraphs((current) =>
          current.map((p) => ({ ...p, isAnalyzing: false }))
        );
      }
    };

    // Start the batch analysis
    analyzeParagraphs();
  }, [article.content]);

  return (
    <Card className="fixed top-5 right-5 w-[400px] h-[90vh] z-[2147483647] flex flex-col overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg">{article.title || "Untitled"}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Site: {article.siteName || "Unknown"} • Length: {article.length} chars
        </p>
      </CardHeader>
      <ScrollArea className="flex-grow overflow-auto px-6">
        <div className="pb-6">
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
        </div>
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
