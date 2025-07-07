import { EnglishToolsStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { executeItem } from "./executeItem";

export async function POST(request: NextRequest) {
  let id: number | undefined;

  try {
    id = (await request.json()).id;

    if (!id) {
      return NextResponse.json({ status: "no id" });
    }

    const { sentence } = await db.englishTools.findUniqueOrThrow({
      where: { id },
      select: {
        sentence: true,
      },
    });

    await executeItem({ id, sentence });

    return NextResponse.json({
      status: "success",
      processed: { id, sentence },
    });
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
