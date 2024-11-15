import React from "react";
import { TextBlock } from "./lib/types";
import { useContentAnalysis } from "./lib/ui/hooks";

interface AppProps {
  textBlocks: TextBlock[];
  performBlockAnalysis: boolean;
}

export const App: React.FC<AppProps> = ({
  textBlocks,
  performBlockAnalysis,
}) => {
  useContentAnalysis(textBlocks, performBlockAnalysis);

  return <div></div>;
};
