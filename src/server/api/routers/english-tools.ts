import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { redis } from "../../../lib/redis";

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

      // Push to queue for processing
      await redis.lpush("sentences-queue", {
        id: sentence.id,
        sentence: sentence.sentence,
        userId: ctx.session.user.id,
      });

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
