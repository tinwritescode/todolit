import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { executePrompt } from "./executePrompt";

export async function POST(request: NextRequest) {
  let id: number | undefined;

  try {
    id = (await request.json()).id;

    if (!id) {
      return NextResponse.json({ status: "no id" });
    }

    const prompt = await db.prompt.findUniqueOrThrow({
      where: { id },
      include: {
        promptTemplate: true,
      },
    });

    await executePrompt({ id, prompt });

    return NextResponse.json({
      status: "success",
      processed: { id, name: prompt.name },
    });
  } catch (error: unknown) {
    console.error("Error processing prompt:", error);

    // Update status to error if we have an ID
    if (id) {
      await db.prompt.update({
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
