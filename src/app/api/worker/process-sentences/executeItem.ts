import Anthropic from "@anthropic-ai/sdk";
import { EnglishToolsStatus } from "@prisma/client";
import { z } from "zod";
import { env } from "../../../../env";
import { db } from "../../../../server/db";

export type Analysis = {
  isCorrect: boolean;
  incorrectReason?: string;
  b1Level: string[];
  b2Level: string[];
  c1Level: string[];
  feedback: string;
};

export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const executeItem = async ({
  id,
  sentence,
}: {
  id: number;
  sentence: string;
}) => {
  // Update status to pending
  await db.englishTools.update({
    where: { id },
    data: { status: EnglishToolsStatus.PENDING },
  });

  // Process the sentence with Claude
  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Analyze this English sentence: "${sentence}"

Please provide:
1. Is it grammatically correct? (true/false)
2. If not correct, explain why (null if correct)
3. What would be the equivalent in B1 level English?
4. What would be the equivalent in B2 level English?
5. What would be the equivalent in C1 level English?
6. Provide feedback on how to improve it.

Format your response in JSON like this:
{
  "isCorrect": boolean,
  "incorrectReason": string | null,
  "b1Level": ["intermediate version 1", "intermediate version 2"],
  "b2Level": ["advanced version 1", "advanced version 2"],
  "c1Level": ["proficient version 1", "proficient version 2"],
  "feedback": "your feedback here"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Unexpected response format from Anthropic");
  }

  const parsedContent = z
    .string()
    .regex(/```json\n(.*)\n```/s, "Invalid JSON response from Anthropic")
    .transform((text) => text.replace(/```json/g, "").replace(/```/g, ""))
    .transform((text: string) => JSON.parse(text) as Analysis);

  const analysis = parsedContent.parse(content.text);

  // Update the database with results
  await db.englishTools.update({
    where: { id },
    data: {
      isCorrect: analysis.isCorrect,
      incorrectReason: analysis.incorrectReason,
      b1Level: analysis.b1Level,
      b2Level: analysis.b2Level,
      c1Level: analysis.c1Level,
      feedback: analysis.feedback,
      status: EnglishToolsStatus.COMPLETE,
    },
  });
};
