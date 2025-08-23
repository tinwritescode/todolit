import Anthropic from "@anthropic-ai/sdk";
import { PromptStatus } from "@prisma/client";
import { z } from "zod";
import { env } from "../../../../env";
import { db } from "../../../../server/db";

export type PromptResult = {
  response: string;
  analysis?: {
    quality: string;
    suggestions: string[];
    estimatedTokens: number;
  };
};

export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const executePrompt = async ({
  id,
  prompt,
}: {
  id: number;
  prompt: {
    id: number;
    name: string | null;
    content: string;
    promptTemplate?: {
      id: number;
      name: string;
      content: string;
      variables: any;
    } | null;
  };
}) => {
  // Update status to pending
  await db.prompt.update({
    where: { id },
    data: { status: PromptStatus.PENDING },
  });

  try {
    // Process the prompt with Claude
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt.content,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response format from Anthropic");
    }

    const response = content.text;

    // Analyze the prompt quality (optional)
    const analysisMessage = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Analyze this prompt: "${prompt.content}"

Please provide:
1. Quality assessment (excellent/good/fair/poor)
2. Suggestions for improvement (array of strings)
3. Estimated token count for this prompt

Format your response in JSON like this:
{
  "quality": "excellent",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "estimatedTokens": 150
}`,
        },
      ],
    });

    const analysisContent = analysisMessage.content[0];
    let analysis = null;

    if (analysisContent && analysisContent.type === "text") {
      try {
        const parsedContent = z
          .string()
          .regex(/```json\n(.*)\n```/s, "Invalid JSON response from Anthropic")
          .transform((text) => text.replace(/```json/g, "").replace(/```/g, ""))
          .transform((text: string) => JSON.parse(text));

        analysis = parsedContent.parse(analysisContent.text);
      } catch (e) {
        // Analysis failed, but we still have the main response
        console.warn("Failed to parse analysis:", e);
      }
    }

    // Update the database with results
    await db.prompt.update({
      where: { id },
      data: {
        result: response,
        status: PromptStatus.COMPLETE,
        errorMessage: null,
      },
    });

    return {
      response,
      analysis,
    };
  } catch (error) {
    // Update status to error
    await db.prompt.update({
      where: { id },
      data: {
        status: PromptStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
};
