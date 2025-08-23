import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { executeSubPrompt } from "./executeSubPrompt";

export async function POST(request: NextRequest) {
  let id: number | undefined;

  try {
    id = (await request.json()).id;

    if (!id) {
      return NextResponse.json({ status: "no id" });
    }

    const subPrompt = await db.subPrompt.findUniqueOrThrow({
      where: { id },
    });

    await executeSubPrompt({ id, subPrompt });

    return NextResponse.json({
      status: "success",
      processed: { id, name: subPrompt.name },
    });
  } catch (error: unknown) {
    console.error("Error processing subprompt:", error);

    // Update status to error if we have an ID
    if (id) {
      await db.subPrompt.update({
        where: { id },
        data: {
          status: "ERROR",
          errorMessage:
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
