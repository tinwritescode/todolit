import { EnglishToolsStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { redis } from "../../../../lib/redis";
import { db } from "../../../../server/db";
import { executeItem } from "./executeItem";

export async function POST() {
  let id: number | undefined;

  try {
    // Pop item from queue
    const item = await redis.rpop<{
      id: number;
      sentence: string;
      userId: string;
    }>("sentences-queue");

    if (!item) {
      return NextResponse.json({ status: "no items in queue" });
    }

    id = item.id;
    const { sentence } = item;

    await executeItem({ id, sentence });

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
