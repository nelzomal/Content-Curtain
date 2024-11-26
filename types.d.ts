// Global interface extension
interface WindowOrWorkerGlobalScope {
  readonly ai: AI;
}

// Declare global ai property
declare const ai: AI;

interface AI {
  readonly languageModel: AILanguageModelFactory;
  readonly writer: AIWriterFactory;
  readonly rewriter: AIRewriterFactory;
}

interface AISession {
  destroy: () => void;
  clone: () => Promise<AISession>;
  countPromptTokens: (text: string) => Promise<number>;
  prompt: (text: string) => Promise<string>;
}

interface AICreateMonitor extends EventTarget {
  ondownloadprogress: ((event: Event) => void) | null;
}

type AICreateMonitorCallback = (monitor: AICreateMonitor) => void;

type AICapabilityAvailability = "readily" | "after-download" | "no";

// Language Model interfaces and types
interface AILanguageModelFactory {
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
  capabilities(): Promise<AILanguageModelCapabilities>;
}

interface AILanguageModel extends EventTarget {
  prompt(
    input: string,
    options?: AILanguageModelPromptOptions
  ): Promise<string>;
  promptStreaming(
    input: string,
    options?: AILanguageModelPromptOptions
  ): ReadableStream;
  countPromptTokens(
    input: string,
    options?: AILanguageModelPromptOptions
  ): Promise<number>;
  readonly maxTokens: number;
  readonly tokensSoFar: number;
  readonly tokensLeft: number;
  readonly topK: number;
  readonly temperature: number;
  clone(): Promise<AILanguageModel>;
  destroy(): void;
}

interface AILanguageModelCapabilities {
  readonly available: AICapabilityAvailability;
  readonly defaultTopK: number | null;
  readonly maxTopK: number | null;
  readonly defaultTemperature: number | null;
}

interface AILanguageModelCreateOptions {
  signal?: AbortSignal;
  monitor?: AICreateMonitorCallback;
  systemPrompt?: string;
  initialPrompts?: AILanguageModelPrompt[];
  topK?: number;
  temperature?: number;
}

interface AILanguageModelPrompt {
  role: AILanguageModelPromptRole;
  content: string;
}

interface AILanguageModelPromptOptions {
  signal?: AbortSignal;
}

type AILanguageModelPromptRole = "system" | "user" | "assistant";

// Writer interfaces and types
interface AIWriterFactory {
  create(options?: AIWriterCreateOptions): Promise<AIWriter>;
  capabilities(): Promise<AIWriterCapabilities>;
}

interface AIWriter {
  write(writingTask: string, options?: AIWriterWriteOptions): Promise<string>;
  writeStreaming(
    writingTask: string,
    options?: AIWriterWriteOptions
  ): ReadableStream;
  readonly sharedContext: string;
  readonly tone: AIWriterTone;
  readonly format: AIWriterFormat;
  readonly length: AIWriterLength;
  destroy(): void;
}

interface AIWriterCapabilities {
  readonly available: AICapabilityAvailability;
  supportsTone(tone: AIWriterTone): AICapabilityAvailability;
  supportsFormat(format: AIWriterFormat): AICapabilityAvailability;
  supportsLength(length: AIWriterLength): AICapabilityAvailability;
  supportsInputLanguage(languageTag: string): AICapabilityAvailability;
}

interface AIWriterCreateOptions {
  signal?: AbortSignal;
  monitor?: AICreateMonitorCallback;
  sharedContext?: string;
  tone?: AIWriterTone;
  format?: AIWriterFormat;
  length?: AIWriterLength;
}

interface AIWriterWriteOptions {
  context?: string;
  signal?: AbortSignal;
}

type AIWriterTone = "formal" | "neutral" | "casual";
type AIWriterFormat = "plain-text" | "markdown";
type AIWriterLength = "short" | "medium" | "long";

// Rewriter interfaces and types
interface AIRewriterFactory {
  create(options?: AIRewriterCreateOptions): Promise<AIRewriter>;
  capabilities(): Promise<AIRewriterCapabilities>;
}

interface AIRewriter {
  rewrite(input: string, options?: AIRewriterRewriteOptions): Promise<string>;
  rewriteStreaming(
    input: string,
    options?: AIRewriterRewriteOptions
  ): ReadableStream;
  readonly sharedContext: string;
  readonly tone: AIRewriterTone;
  readonly format: AIRewriterFormat;
  readonly length: AIRewriterLength;
  destroy(): void;
}

interface AIRewriterCapabilities {
  readonly available: AICapabilityAvailability;
  supportsTone(tone: AIRewriterTone): AICapabilityAvailability;
  supportsFormat(format: AIRewriterFormat): AICapabilityAvailability;
  supportsLength(length: AIRewriterLength): AICapabilityAvailability;
  supportsInputLanguage(languageTag: string): AICapabilityAvailability;
}

interface AIRewriterCreateOptions {
  signal?: AbortSignal;
  monitor?: AICreateMonitorCallback;
  sharedContext?: string;
  tone?: AIRewriterTone;
  format?: AIRewriterFormat;
  length?: AIRewriterLength;
}

interface AIRewriterRewriteOptions {
  context?: string;
  signal?: AbortSignal;
}

type AIRewriterTone = "as-is" | "more-formal" | "more-casual";
type AIRewriterFormat = "as-is" | "plain-text" | "markdown";
type AIRewriterLength = "as-is" | "shorter" | "longer";
