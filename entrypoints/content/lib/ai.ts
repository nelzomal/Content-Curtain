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

function truncateMessage(message: string, maxTokens: number = 1500): string {
  if (message.length <= maxTokens) return message;

  // Split into words to avoid cutting words in half
  const words = message.split(/\s+/);

  // Calculate word counts for each section
  const startWords = 400;
  const middleWords = 200;
  const endWords = 200;

  if (words.length <= startWords + middleWords + endWords) {
    return message;
  }

  const start = words.slice(0, startWords).join(" ");
  const middle = words
    .slice(
      Math.floor(words.length / 2) - middleWords / 2,
      Math.floor(words.length / 2) + middleWords / 2
    )
    .join(" ");
  const end = words.slice(-endWords).join(" ");

  return `${start}\n\n[...]\n\n${middle}\n\n[...]\n\n${end}`;
}

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
  sensitivityLevel: number; // 0-10 scale
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
    const estimatedTokens = await session.countPromptTokens(
      SYSTEM_PROMPT + message
    );

    // If estimated tokens exceed 1500, truncate the message
    const processedMessage =
      estimatedTokens > 1500 ? truncateMessage(message) : message;

    const estimatedTokensAfterTruncation = await session.countPromptTokens(
      SYSTEM_PROMPT + processedMessage
    );

    console.log("\n=== AI Request ===");
    console.log(
      `Estimated tokens for message: ${estimatedTokens} ${estimatedTokensAfterTruncation}`
    );
    console.log("Message:", processedMessage);

    const result = await session.prompt(processedMessage);

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

interface SafetyAnalysis {
  safetyLevel: "safe" | "too sensitive" | "OK";
  explanation: string; // Make explanation required
}

export async function analyzeContentSafety(
  text: string
): Promise<SafetyAnalysis> {
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
