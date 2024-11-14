// AI System Prompt
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

// Token limits
export const MAX_TOKENS = 1500;
export const WORD_COUNTS = {
  START: 400,
  MIDDLE: 200,
  END: 200,
};

// AI Prompts
export const SENSITIVITY_RATING_PROMPT = `Rate the following text for adult content and violence on a scale of 0-10 where:
      1-2: No adult content or violence
      2-4: Mild references to adult themes or mild violence (like pushing)
      4-6: Moderate adult content or violence (fighting, mild gore)
      6-8: Strong adult content or violence
      8-10: Extreme adult content or extreme violence
      
      Provide the rating and a brief explanation focusing only on adult content and violence levels.

Text to analyze: "{{text}}"`;
