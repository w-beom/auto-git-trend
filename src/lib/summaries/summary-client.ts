import OpenAI from "openai";

export interface SummaryClient {
  summarize(prompt: string): Promise<string>;
}

export interface OpenAISummaryClientOptions {
  model?: string;
  processEnv?: NodeJS.ProcessEnv;
}

function loadOpenAIKey(processEnv: NodeJS.ProcessEnv = process.env): string {
  const apiKey = processEnv.OPENAI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    throw new Error("Invalid summary environment: OPENAI_API_KEY is required");
  }

  return apiKey;
}

export function createOpenAISummaryClient(
  options: OpenAISummaryClientOptions = {},
): SummaryClient {
  const apiKey = loadOpenAIKey(options.processEnv);
  const client = new OpenAI({
    apiKey,
  });
  const model = options.model ?? "gpt-5-mini";

  return {
    async summarize(prompt: string): Promise<string> {
      const response = await client.responses.create({
        model,
        input: prompt,
      });

      return response.output_text.trim();
    },
  };
}
