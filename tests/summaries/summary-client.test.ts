import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const responsesCreate = vi.fn();
  const openAIConstructor = vi.fn(() => ({
    responses: {
      create: responsesCreate,
    },
  }));

  return {
    responsesCreate,
    openAIConstructor,
  };
});

vi.mock("openai", () => ({
  default: mocks.openAIConstructor,
}));

import { createOpenAISummaryClient } from "@/lib/summaries/summary-client";

describe("createOpenAISummaryClient", () => {
  beforeEach(() => {
    mocks.responsesCreate.mockReset();
    mocks.openAIConstructor.mockClear();
  });

  it("only requires OPENAI_API_KEY and trims the model output", async () => {
    mocks.responsesCreate.mockResolvedValue({
      output_text: "  한국어 응답  \n",
    });

    const client = createOpenAISummaryClient({
      processEnv: {
        OPENAI_API_KEY: "test-openai-key",
      } as unknown as NodeJS.ProcessEnv,
    });

    await expect(client.summarize("prompt text")).resolves.toBe("한국어 응답");
    expect(mocks.openAIConstructor).toHaveBeenCalledWith({
      apiKey: "test-openai-key",
    });
    expect(mocks.responsesCreate).toHaveBeenCalledWith({
      model: "gpt-5-mini",
      input: "prompt text",
    });
  });
});
