let aiSession: any = null;
const SYSTEM_PROMPT = `You are a friendly, helpful AI assistant with strict content moderation standards. your main work is to rate.

      Content Moderation Rules:
      - Strictly avoid any adult themes, violence, inappropriate language, or mature content
      - Immediately reject requests involving harmful, dangerous, or unsafe activities
      - Keep responses educational and family-friendly
      - If a topic is inappropriate for children, politely decline to discuss it
      
      General Guidelines:
      - Be concise but informative
      - If you don't know something, be honest about it
      - Always prioritize user safety and well-being`;

export async function ensureSession() {
  if (!aiSession) {
    aiSession = await ai.languageModel.create({
      systemPrompt: SYSTEM_PROMPT,
    });
  }
  return aiSession;
}

export interface SensitivityAnalysis {
  text: string;
  sensitivityLevel: number; // 0-100 scale
  explanation?: string;
}

export interface SensitivityAnalysisOptions {
  batchSize?: number;
}

export async function analyzeSensitivity(
  text: string
): Promise<SensitivityAnalysis> {
  try {
    const prompt = `Rate the following text for adult content and violence on a scale of 0-10 where:
          1-2: No adult content or violence
          2-4: Mild references to adult themes or mild violence (like pushing)
          4-6: Moderate adult content or violence (fighting, mild gore)
          6-8: Strong adult content or violence
          8-10: Extreme adult content or extreme violence
          
          Provide the rating and a brief explanation focusing only on adult content and violence levels.
    
    Text to analyze: "${text}"`;

    const result = await sendMessage(prompt);

    // Parse the AI response
    const match = result.match(/(\d+)/);
    const level = match ? parseInt(match[0]) : 0;

    return {
      text,
      sensitivityLevel: level,
      explanation: result,
    };
  } catch (error) {
    console.error("Error in analyzeSensitivity:", error);
    throw error;
  }
}

export type ContentSafetyLevel = "safe" | "too sensitive" | "OK";

export interface ContentSafetyAnalysis {
  text: string;
  safetyLevel: ContentSafetyLevel;
  explanation?: string;
}

export async function sendMessage(message: string): Promise<string> {
  try {
    const session = await ensureSession();

    // Estimate tokens including system prompt since it's part of the context
    const estimatedTokens = estimateTokens(SYSTEM_PROMPT + message);
    console.log("\n=== AI Request ===");
    console.log(`Estimated tokens for message: ${estimatedTokens}`);
    console.log("Message:", message);

    const result = await session.prompt(message);

    console.log("\n=== AI Response ===");
    console.log(result);
    console.log(
      `Token usage: ${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} left)`
    );

    return result;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}

export async function analyzeContentSafety(
  text: string
): Promise<ContentSafetyAnalysis> {
  try {
    const sensitivity = await analyzeSensitivity(text);

    console.log("\n=== Content Safety Analysis ===");
    console.log("Raw sensitivity analysis:", sensitivity);
    console.log("Sensitivity level:", sensitivity.sensitivityLevel);
    console.log("Raw explanation:", sensitivity.explanation);

    // Classify based on sensitivity level
    let safetyLevel: ContentSafetyLevel;
    if (sensitivity.sensitivityLevel <= 2) {
      safetyLevel = "safe";
    } else if (sensitivity.sensitivityLevel >= 7) {
      safetyLevel = "too sensitive";
    } else {
      safetyLevel = "OK";
    }

    const analysis = {
      text,
      safetyLevel,
      explanation: sensitivity.explanation,
    };

    console.log("Final classification:", analysis);
    console.log("===========================\n");

    return analysis;
  } catch (error) {
    console.error("Error in analyzeContentSafety:", error);
    throw error;
  }
}

export function estimateTokens(text: string): number {
  // Simple estimation rules:
  // - Average English word is 4-5 characters
  // - Most GPT tokenizers treat common words as single tokens
  // - Special characters and spaces usually count as separate tokens
  // - Numbers and punctuation often get their own tokens

  if (!text) return 0;

  // Count words (splitting on whitespace)
  const words = text.trim().split(/\s+/).length;

  // Count numbers and special characters
  const numbers = (text.match(/\d+/g) || []).length;
  const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;

  // Estimate total tokens:
  // - Each word is roughly 1 token
  // - Numbers often split into multiple tokens
  // - Special characters usually get their own tokens
  const estimatedTokens = words + numbers + specialChars;

  // Add a small buffer for safety
  return Math.ceil(estimatedTokens * 1.2);
}
