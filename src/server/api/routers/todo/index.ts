import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const todoRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.todo.findMany({
      where: {
        project: {
          userId: ctx.session.user.id,
        },
      },
      include: {
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.todo.create({
        data: {
          title: input.title,
          projectId: input.projectId,
          dueDate: input.dueDate,
          completed: false,
        },
      });
    }),

  toggle: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        completed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.todo.update({
        where: { id: input.id },
        data: {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.todo.delete({
        where: { id: input },
      });
    }),

  updateTitle: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.todo.update({
        where: { id: input.id },
        data: { title: input.title },
      });
    }),
});
