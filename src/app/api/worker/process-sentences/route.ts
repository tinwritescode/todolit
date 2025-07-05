import { redis } from "../../../../lib/redis";
import { NextResponse } from "next/server";
import { env } from "../../../../env";
import { Anthropic } from "@anthropic-ai/sdk";
import { db } from "../../../../server/db";
import { EnglishToolsStatus } from "@prisma/client";

export const runtime = "edge";
export const preferredRegion = "sin1"; // Singapore region for lower latency

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function POST() {
  let id: number | undefined;

  try {
    // Pop item from queue
    const item = await redis.rpop("sentences-queue");

    if (!item) {
      return NextResponse.json({ status: "no items in queue" });
    }

    const parsed = JSON.parse(item);
    id = parsed.id;
    const { sentence, userId } = parsed;

    // Update status to pending
    await db.englishTools.update({
      where: { id },
      data: { status: EnglishToolsStatus.PENDING },
    });

    // Process the sentence with Claude
    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze this English sentence: "${sentence}"

Please provide:
1. Is it grammatically correct? (true/false)
2. What would be the equivalent in A1 level English?
3. What would be the equivalent in B1 level English?
4. What would be the equivalent in B2 level English?
5. Provide feedback on how to improve it.

Format your response in JSON like this:
{
  "isCorrect": boolean,
  "a1Level": ["simpler version 1", "simpler version 2"],
  "b1Level": ["intermediate version 1", "intermediate version 2"],
  "b2Level": ["advanced version 1", "advanced version 2"],
  "feedback": "your feedback here"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response format from Anthropic");
    }

    const analysis = JSON.parse(content.text);

    // Update the database with results
    await db.englishTools.update({
      where: { id },
      data: {
        isCorrect: analysis.isCorrect,
        a1Level: analysis.a1Level,
        b1Level: analysis.b1Level,
        b2Level: analysis.b2Level,
        feedback: analysis.feedback,
        status: EnglishToolsStatus.COMPLETE,
      },
    });

    return NextResponse.json({ status: "success", processed: item });
  } catch (error: unknown) {
    console.error("Error processing sentence:", error);

    // Update status to error if we have an ID
    if (id) {
      await db.englishTools.update({
        where: { id },
        data: {
          status: EnglishToolsStatus.ERROR,
          feedback:
            error instanceof Error
              ? error.message
              : "Unknown error occurred during processing",
        },
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
