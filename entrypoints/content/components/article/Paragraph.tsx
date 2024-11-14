import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ParagraphWithSensitivity } from "@/entrypoints/content/types";

interface ParagraphProps {
  paragraph: ParagraphWithSensitivity;
}

export function getSensitivityClass(level: number): string {
  const classes = {
    0: "bg-green-100 text-green-800",
    1: "bg-orange-100 text-orange-800",
    2: "bg-red-100 text-red-800",
    3: "bg-orange-100 text-orange-800",
    4: "bg-red-100 text-red-800",
  };

  const baseLevel = Math.floor(level / 20);
  return (
    classes[baseLevel as keyof typeof classes] || "bg-gray-100 text-gray-800"
  );
}

export const Paragraph: React.FC<ParagraphProps> = ({ paragraph }) => {
  return (
    <div className="relative mb-6">
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
  );
};
