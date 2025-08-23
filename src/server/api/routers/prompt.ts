import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { env } from "../../../env";

export const promptRouter = createTRPCRouter({
  // Prompt operations
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.prompt.findMany({
      where: { userId: ctx.session.user.id },
      include: { promptTemplate: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const prompt = await ctx.db.prompt.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          promptTemplate: true,
          subPrompts: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      return prompt;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        content: z.string().min(1),
        promptTemplateId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Prisma.PromptCreateInput = {
        name: input.name,
        content: input.content,
        user: { connect: { id: ctx.session.user.id } },
        promptTemplate: input.promptTemplateId
          ? {
              connect: {
                id: input.promptTemplateId,
              },
            }
          : undefined,
      };

      return ctx.db.prompt.create({
        data,
        include: { promptTemplate: true },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        content: z.string().min(1),
        promptTemplateId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.db.prompt.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      return ctx.db.prompt.update({
        where: { id: input.id },
        data: {
          name: input.name,
          content: input.content,
          promptTemplateId: input.promptTemplateId,
        },
        include: { promptTemplate: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.db.prompt.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      return ctx.db.prompt.delete({
        where: { id: input.id },
      });
    }),

  // Prompt template operations
  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.promptTemplate.findMany({
      where: {
        OR: [{ userId: ctx.session.user.id }, { isPublic: true }],
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        content: z.string().min(1),
        variables: z.record(z.any()).optional(),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.promptTemplate.create({
        data: {
          name: input.name,
          content: input.content,
          variables: input.variables || {},
          isPublic: input.isPublic,
          user: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        content: z.string().min(1),
        variables: z.record(z.any()).optional(),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.promptTemplate.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return ctx.db.promptTemplate.update({
        where: { id: input.id },
        data: {
          name: input.name,
          content: input.content,
          variables: input.variables || {},
          isPublic: input.isPublic,
        },
      });
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.promptTemplate.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return ctx.db.promptTemplate.delete({
        where: { id: input.id },
      });
    }),

  process: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.db.prompt.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      // Trigger the worker to process the prompt
      const response = await fetch(
        `${env.NEXT_PUBLIC_APP_URL}/api/worker/process-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: input.id }),
        },
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger prompt processing",
        });
      }

      return { success: true };
    }),

  // SubPrompt operations
  createSubPrompt: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        content: z.string().min(1),
        promptId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the parent prompt belongs to the user
      const prompt = await ctx.db.prompt.findFirst({
        where: { id: input.promptId, userId: ctx.session.user.id },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent prompt not found",
        });
      }

      return ctx.db.subPrompt.create({
        data: {
          name: input.name,
          content: input.content,
          promptId: input.promptId,
        },
      });
    }),

  updateSubPrompt: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find the subprompt and verify ownership through parent prompt
      const subPrompt = await ctx.db.subPrompt.findFirst({
        where: {
          id: input.id,
          Prompt: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!subPrompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SubPrompt not found",
        });
      }

      return ctx.db.subPrompt.update({
        where: { id: input.id },
        data: {
          name: input.name,
          content: input.content,
        },
      });
    }),

  deleteSubPrompt: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Find the subprompt and verify ownership through parent prompt
      const subPrompt = await ctx.db.subPrompt.findFirst({
        where: {
          id: input.id,
          Prompt: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!subPrompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SubPrompt not found",
        });
      }

      return ctx.db.subPrompt.delete({
        where: { id: input.id },
      });
    }),

  executeSubPrompt: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Find the subprompt and verify ownership through parent prompt
      const subPrompt = await ctx.db.subPrompt.findFirst({
        where: {
          id: input.id,
          Prompt: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!subPrompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SubPrompt not found",
        });
      }

      // Trigger the worker to process the subprompt
      const response = await fetch(
        `${env.NEXT_PUBLIC_APP_URL}/api/worker/process-subprompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: input.id }),
        },
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger subprompt processing",
        });
      }

      return { success: true };
    }),
});
