import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const backupFilesRouter = createTRPCRouter({
  // List all backup files for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const backupFiles = await ctx.db.backupFile.findMany({
      where: {
        userId: ctx.session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return backupFiles;
  }),

  // Create a new backup file record
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileKey: z.string(),
        fileSize: z.number().positive(),
        mimeType: z.string(),
        version: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const backupFile = await ctx.db.backupFile.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
      return backupFile;
    }),

  // Delete a backup file
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const backupFile = await ctx.db.backupFile.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!backupFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Backup file not found",
        });
      }

      // Soft delete by setting isActive to false
      await ctx.db.backupFile.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  // Get a specific backup file
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const backupFile = await ctx.db.backupFile.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          isActive: true,
        },
      });

      if (!backupFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Backup file not found",
        });
      }

      return backupFile;
    }),

  // Update backup file metadata
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        version: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const backupFile = await ctx.db.backupFile.findFirst({
        where: {
          id,
          userId: ctx.session.user.id,
          isActive: true,
        },
      });

      if (!backupFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Backup file not found",
        });
      }

      const updated = await ctx.db.backupFile.update({
        where: { id },
        data: updateData,
      });

      return updated;
    }),
});
