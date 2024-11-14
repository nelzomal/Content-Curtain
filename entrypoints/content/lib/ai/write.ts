let writerInstance: AIWriter | null = null;
let rewriterInstance: AIRewriter | null = null;

export async function createWriter(
  options: AIWriterCreateOptions = {}
): Promise<AIWriter> {
  if (!writerInstance) {
    console.log("createWriter: ", ai);
    writerInstance = await ai.writer.create(options);
    console.log("writerInstance: ", writerInstance);
  }
  return writerInstance;
}

export async function write(
  writingTask: string,
  options: AIWriterWriteOptions = {}
): Promise<string> {
  const writer = await createWriter();
  console.log("writer: ", writer);
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
