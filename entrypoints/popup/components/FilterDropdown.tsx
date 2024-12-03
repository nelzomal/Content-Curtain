"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { PromptConfig } from "@/entrypoints/content/lib/types";

interface FilterDropdownProps {
  prompts: Record<string, PromptConfig>;
  activePrompt: string;
  disabled?: boolean;
  onSelect: (prompt: PromptConfig) => void;
  onRemove: (name: string) => void;
}

export function FilterDropdown({
  prompts,
  activePrompt,
  disabled,
  onSelect,
  onRemove,
}: FilterDropdownProps) {
  const handleOpenChange = (open: boolean) => {
    if (open) {
      document.body.classList.add("dropdown-open");
    } else {
      document.body.classList.remove("dropdown-open");
    }
  };

  const handleSelect = (name: string, prompt: PromptConfig) => {
    const promptWithName = {
      ...prompt,
      name: name,
    };
    onSelect?.(promptWithName);
  };

  const handleRemove = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    onRemove?.(name);
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger disabled={disabled} asChild>
        <Button variant="outline" className="w-[180px] justify-start">
          <Filter className="mr-2 h-4 w-4" />
          <span>{prompts[activePrompt]?.name || "Select Filter"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[180px]">
        <DropdownMenuSeparator />
        {Object.entries(prompts).map(([name, prompt]) => (
          <DropdownMenuItem
            key={name}
            onClick={() => handleSelect(name, prompt)}
            className={`
              ${activePrompt === name ? "bg-accent" : ""}
              group flex justify-between items-center
            `}
          >
            <span>{name}</span>
            {name !== activePrompt && (
              <button
                onClick={(e) => handleRemove(e, name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
