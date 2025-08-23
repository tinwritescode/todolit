import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { env } from "../../../env";

export const speechToTextRouter = createTRPCRouter({
  transcribe: publicProcedure
    .input(
      z.object({
        audioData: z.string(), // Base64 encoded audio data
        mimeType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(input.audioData, "base64");

        // Use OpenAI's Whisper API for transcription since Claude doesn't have a dedicated audio endpoint
        const response = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: (() => {
              const formData = new FormData();
              formData.append(
                "file",
                new Blob([audioBuffer], {
                  type: input.mimeType ?? "audio/wav",
                }),
                "audio.wav",
              );
              formData.append("model", "whisper-1");
              formData.append(
                "prompt",
                "Please transcribe this audio accurately. Return only the transcribed text without any additional formatting or punctuation unless it was clearly spoken.",
              );
              return formData;
            })(),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Claude API error: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }

        const result = await response.json();

        // Extract the transcribed text from the transcription response
        const transcribedText = result.text ?? "";

        return {
          success: true,
          text: transcribedText.trim(),
        };
      } catch (error) {
        console.error("Speech-to-text error:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    }),
});
