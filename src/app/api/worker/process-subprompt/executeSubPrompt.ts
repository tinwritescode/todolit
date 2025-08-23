import { db } from "../../../../server/db";
import { PromptStatus } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const executeSubPrompt = async ({
  id,
  subPrompt,
}: {
  id: number;
  subPrompt: {
    id: number;
    name: string;
    content: string;
  };
}) => {
  // Update status to pending
  await db.subPrompt.update({
    where: { id },
    data: { status: PromptStatus.PENDING },
  });

  try {
    // Process the subprompt with Claude
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: subPrompt.content,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response format from Anthropic");
    }

    const response = content.text;

    // Update the database with results
    await db.subPrompt.update({
      where: { id },
      data: {
        result: response,
        status: PromptStatus.COMPLETE,
        errorMessage: null,
      },
    });

    return {
      response,
    };
  } catch (error) {
    // Update status to error
    await db.subPrompt.update({
      where: { id },
      data: {
        status: PromptStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
};
