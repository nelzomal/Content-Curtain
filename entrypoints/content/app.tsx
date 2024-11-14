import React, { useEffect } from "react";
import { TextBlock } from "./lib/types";

interface AppProps {
  textBlocks: TextBlock[];
}

export const App: React.FC<AppProps> = ({ textBlocks }) => {
  useEffect(() => {
    // Apply blur effect to long text blocks
    textBlocks.forEach((block) => {
      if (block.text.length > 100 && block.nodes) {
        console.log("block.text longer than 100: ", block.text);
        block.nodes.forEach((node) => {
          if (node.parentElement) {
            node.parentElement.style.filter = "blur(4px)";
            // Add transition for smooth effect
            node.parentElement.style.transition = "filter 0.3s ease";
          }
        });
      } else {
        console.log("block.text less than 100: ", block.text);
      }
    });

    // Cleanup function to remove blur when component unmounts
    return () => {
      textBlocks.forEach((block) => {
        if (block.nodes) {
          block.nodes.forEach((node) => {
            if (node.parentElement) {
              node.parentElement.style.filter = "";
              node.parentElement.style.transition = "";
            }
          });
        }
      });
    };
  }, [textBlocks]);

  return (
    <div>
      {/* {textBlocks.map((block) => (
        <div key={block.index}>{block.text}</div>
      ))} */}
    </div>
  );
};
