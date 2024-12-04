let writerInstance: AIWriter | null = null;
let rewriterInstance: AIRewriter | null = null;

export async function createWriter(
  options: AIWriterCreateOptions = {}
): Promise<AIWriter> {
  if (!writerInstance) {
    writerInstance = await ai.writer.create(options);
  }
  return writerInstance;
}

export async function write(
  writingTask: string,
  options: AIWriterWriteOptions = {}
): Promise<string> {
  const writer = await createWriter();
  return await writer.write(writingTask, options);
}

export async function writeStreaming(
  writingTask: string,
  options: AIWriterWriteOptions = {}
): Promise<ReadableStream> {
  const writer = await createWriter();
  return writer.writeStreaming(writingTask, options);
}

export async function createRewriter(
  options: AIRewriterCreateOptions = {}
): Promise<AIRewriter> {
  if (!rewriterInstance) {
    rewriterInstance = await ai.rewriter.create(options);
  }
  return rewriterInstance;
}

export async function rewrite(
  input: string,
  options: AIRewriterRewriteOptions = {}
): Promise<string> {
  const rewriter = await createRewriter();
  return await rewriter.rewrite(input, options);
}

export async function rewriteStreaming(
  input: string,
  options: AIRewriterRewriteOptions = {}
): Promise<ReadableStream> {
  const rewriter = await createRewriter();
  return rewriter.rewriteStreaming(input, options);
}

export function destroyWriter(): void {
  if (writerInstance) {
    writerInstance.destroy();
    writerInstance = null;
  }
}

export function destroyRewriter(): void {
  if (rewriterInstance) {
    rewriterInstance.destroy();
    rewriterInstance = null;
  }
}
export async function checkWriterCapability(): Promise<boolean> {
  try {
    const writer = await createWriter({
      sharedContext: `test`,
    });
    const isSuccess = writer !== null;
    destroyWriter();
    return isSuccess;
  } catch (error) {
    console.error("[checkSummarizeCapability] Summarizer check failed:", error);
    return false;
  }
}
