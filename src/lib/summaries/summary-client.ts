import OpenAI from "openai";

import { loadServerEnv } from "@/lib/env";

export interface SummaryClient {
  summarize(prompt: string): Promise<string>;
}

export interface OpenAISummaryClientOptions {
  model?: string;
  processEnv?: NodeJS.ProcessEnv;
}

export function createOpenAISummaryClient(
  options: OpenAISummaryClientOptions = {},
): SummaryClient {
  const env = loadServerEnv(options.processEnv);
  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  const model = options.model ?? "gpt-5-mini";

  return {
    async summarize(prompt: string): Promise<string> {
      const response = await client.responses.create({
        model,
        input: prompt,
      });

      return response.output_text;
    },
  };
}
