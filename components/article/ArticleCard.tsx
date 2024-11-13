import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArticleContent,
  ParagraphWithSensitivity,
} from "@/entrypoints/content/types";
import { Paragraph } from "./Paragraph";

interface ArticleCardProps {
  article: ArticleContent;
  paragraphs: ParagraphWithSensitivity[];
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  paragraphs,
}) => {
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
            <Paragraph key={paragraph.id} paragraph={paragraph} />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
