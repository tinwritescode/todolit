import { NextResponse } from "next/server";
import { env } from "../../../../env";

export const runtime = "edge";
export const preferredRegion = "sin1";

// Protect the route with a secret header
const CRON_SECRET = env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify the secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // TODO: Call the worker endpoint

    return NextResponse.json({ status: "success" });
  } catch (error: unknown) {
    console.error("Error triggering worker:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
