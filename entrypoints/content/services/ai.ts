let aiSession: any = null;

export async function ensureSession() {
  if (!aiSession) {
    aiSession = await ai.languageModel.create({
      systemPrompt: `You are a friendly, helpful AI assistant. You engage in natural conversations and provide helpful responses.
      - Provide detailed, relevant answers to questions
      - Be concise but informative
      - If asked about math, provide step-by-step explanations
      - If you don't know something, be honest about it`,
    });
  }
  return aiSession;
}

export async function sendMessage(message: string): Promise<string> {
  try {
    const session = await ensureSession();
    const result = await session.prompt(message);
    console.log(
      `Token usage: ${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} left)`
    );
    return result;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}

export async function* sendMessageStreaming(
  message: string
): AsyncGenerator<string> {
  try {
    const session = await ensureSession();
    const stream = session.promptStreaming(message);

    for await (const chunk of stream) {
      yield chunk;
    }

    console.log(
      `Token usage: ${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} left)`
    );
  } catch (error) {
    console.error("Error in sendMessageStreaming:", error);
    throw error;
  }
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
    const session = await ensureSession();
    const prompt = `Rate the following text for adult content and violence on a scale of 0-100 where:
    0-20: No adult content or violence
    21-40: Mild references to adult themes or mild violence (like pushing)
    41-60: Moderate adult content or violence (fighting, mild gore)
    61-80: Strong adult content or graphic violence
    81-100: Extreme adult content or extreme violence
    
    Provide the rating and a brief explanation focusing only on adult content and violence levels.
    
    Text to analyze: "${text}"`;

    console.log("\n=== AI Request ===");
    console.log("Prompt:", prompt);

    const result = await session.prompt(prompt);

    console.log("\n=== AI Response ===");
    console.log(result);

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

export async function* analyzeSensitivityBatch(
  texts: string[],
  options: SensitivityAnalysisOptions = {}
): AsyncGenerator<SensitivityAnalysis> {
  const { batchSize = 5 } = options;

  try {
    console.log(
      `Starting analysis of ${texts.length} texts in batches of ${batchSize}`
    );

    // Get the main session
    const mainSession = await ensureSession();

    // Process texts in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(
        `\nProcessing batch ${i / batchSize + 1}, texts ${i + 1}-${
          i + batch.length
        }`
      );
      const batchStartTime = Date.now();

      // Create parallel promises for each text in the batch
      const batchPromises = batch.map(async (text, index) => {
        const startTime = Date.now();
        console.log(`[${i + index + 1}] Starting analysis...`);

        const sessionClone = await mainSession.clone();

        const prompt = `Rate the following text for adult content and violence on a scale of 0-100 where:
          0-20: No adult content or violence
          21-40: Mild references to adult themes or mild violence (like pushing)
          41-60: Moderate adult content or violence (fighting, mild gore)
          61-80: Strong adult content or graphic violence
          81-100: Extreme adult content or extreme violence
          
          Provide the rating and a brief explanation focusing only on adult content and violence levels.
          
          Text to analyze: "${text}"`;

        console.log(`\n=== AI Request ${i + index + 1} ===`);
        console.log("Prompt:", prompt);

        const result = await sessionClone.prompt(prompt);

        console.log(`\n=== AI Response ${i + index + 1} ===`);
        console.log(result);

        const match = result.match(/(\d+)/);
        const level = match ? parseInt(match[0]) : 0;

        const duration = Date.now() - startTime;
        console.log(`[${i + index + 1}] Completed in ${duration}ms`);
        console.log(
          `Token usage for request ${i + index + 1}: ${
            sessionClone.tokensSoFar
          }/${sessionClone.maxTokens}`
        );

        return {
          text,
          sensitivityLevel: level,
          explanation: result,
        };
      });

      // Process promises as they complete
      const pendingPromises = new Set(batchPromises);
      while (pendingPromises.size > 0) {
        const nextPromise = Promise.race(
          Array.from(pendingPromises).map(async (promise) => {
            const result = await promise;
            return { promise, result };
          })
        );
        const { promise, result } = await nextPromise;
        pendingPromises.delete(promise);
        yield result;
      }

      const batchDuration = Date.now() - batchStartTime;
      console.log(`Batch completed in ${batchDuration}ms`);
    }

    console.log(`\nAll analysis complete. Processed ${texts.length} texts.`);
  } catch (error) {
    console.error("Error in analyzeSensitivityBatch:", error);
    throw error;
  }
}
