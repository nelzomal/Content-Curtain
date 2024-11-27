import { PromptType, PromptConfig, Settings } from "./types";

// Export the previously used constants
export const SYSTEM_PROMPT = `You are a friendly, helpful AI assistant with strict content moderation standards. your main work is to rate.

      Content Moderation Rules:
      - Strictly avoid any adult themes, violence, inappropriate language, or mature content
      - Immediately reject requests involving harmful, dangerous, or unsafe activities
      - Keep responses educational and family-friendly
      - If a topic is inappropriate for children, politely decline to discuss it
      
      General Guidelines:
      - Be concise but informative
      - If you don't know something, be honest about it
      - Always prioritize user safety and well-being`;

export const SAFETY_LEVEL_PROMPT = `Rate the following text for adult content and violence on a scale of 0-10 where:
      0-2: No adult content or violence
      3-4: Mild references to adult themes or mild violence (like pushing)
      5-6: Moderate adult content or violence (fighting, mild gore)
      7-8: Strong adult content or violence
      9-10: Extreme adult content or extreme violence
      
      Provide the rating and a brief explanation focusing only on adult content and violence levels.
      Text to analyze: "{{text}}"`;

// Default prompts for different content types
export const DEFAULT_PROMPTS: Record<PromptType, PromptConfig> = {
  nsfw: {
    systemPrompt: SYSTEM_PROMPT,
    safetyLevelPrompt: SAFETY_LEVEL_PROMPT,
  },

  sportsSpoiler: {
    systemPrompt: `You are an AI assistant specialized in identifying and rating sports-related spoilers. Your main task is to analyze and rate content.

      Sports Spoiler Guidelines:
      - Identify game results, scores, and match outcomes
      - Detect player transfers, retirements, and major announcements
      - Flag championship and tournament results
      - Identify injury reports and team roster changes
      - Recognize draft picks and trading news
      
      General Guidelines:
      - Be precise in identifying time-sensitive sports information
      - Consider the context and timeframe of the sporting event
      - Focus only on factual sports-related information
      - Maintain neutrality in analysis`,

    safetyLevelPrompt: `Rate the following text for sports spoilers on a scale of 0-10 where:
      0-2: No sports spoilers (general discussion, historical facts)
      3-4: Mild sports information (game schedules, player interviews)
      5-6: Moderate spoilers (partial game updates, team statistics)
      7-8: Significant spoilers (final scores, major plays)
      9-10: Critical spoilers (championship results, major career announcements)
      
      Provide the rating and a brief explanation focusing only on the level of sports spoilers.

      Text to analyze: "{{text}}"`,
  },
};

// filter out blocks that are too short
export const MIN_BLOCK_LENGTH = 20;

// Token limits
export const MAX_TOKENS = 2500;
export const WORD_COUNTS = {
  START: 1000,
  MIDDLE: 500,
  END: 1000,
};

export const DEFAULT_SETTINGS: Settings = {
  activePromptType: "nsfw",
  customPrompts: DEFAULT_PROMPTS,
  contentStrictness: "medium",
  contentAnalysisEnabled: true,
};
