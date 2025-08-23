import { z } from "zod";
import { executeItem } from "@/app/api/worker/process-sentences/executeItem";
import { env } from "../../../env";
import { qstash } from "../../qstash";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const englishToolsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ sentence: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sentence = await ctx.db.englishTools.create({
        data: {
          sentence: input.sentence,
          authorId: ctx.session.user.id,
        },
      });

      if (env.NODE_ENV === "development") {
        await executeItem({ id: sentence.id, sentence: sentence.sentence });
      } else {
        await qstash
          .queue({
            queueName: "Default",
          })
          .enqueue({
            url: new URL(
              "/api/worker/process-sentences",
              env.NEXT_PUBLIC_APP_URL,
            ).toString(),
            method: "POST",
            body: JSON.stringify({
              id: sentence.id,
              sentence: sentence.sentence,
            }),
          });
      }

      return sentence;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.englishTools.findMany({
      where: { authorId: ctx.session.user.id },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.englishTools.delete({
        where: {
          id: input.id,
          authorId: ctx.session.user.id,
        },
      });
    }),

  togglePin: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sentence = await ctx.db.englishTools.findUnique({
        where: { id: input.id, authorId: ctx.session.user.id },
      });

      if (!sentence) {
        throw new Error("Sentence not found");
      }

      return ctx.db.englishTools.update({
        where: { id: input.id },
        data: {
          pinned: !sentence.pinned,
          pinnedAt: !sentence.pinned ? new Date() : null,
        },
      });
    }),
});
