import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const syncSimpleRouter = createTRPCRouter({
  // Push local changes to cloud (simplified version)
  pushChanges: protectedProcedure
    .input(
      z.object({
        todos: z.array(z.any()),
        completeMode: z.boolean(),
        deviceId: z.string(),
        syncVersion: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create backup data
        const data = {
          todos: input.todos,
          completeMode: input.completeMode,
          exportDate: new Date().toISOString(),
          version: "1.0",
          deviceId: input.deviceId,
          syncVersion: input.syncVersion,
        };

        const jsonString = JSON.stringify(data, null, 2);

        // Create a simple backup record without file upload for now
        const now = new Date();
        const backupData = {
          name: `Auto-Sync Backup - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
          description: `Auto-sync from device ${input.deviceId}`,
          fileName: `auto-sync-${now.toISOString()}.json`,
          fileUrl: `data:application/json;base64,${Buffer.from(jsonString).toString("base64")}`,
          fileKey: `auto-sync-${Date.now()}`,
          fileSize: jsonString.length,
          mimeType: "application/json",
          version: "1.0",
          category: "auto-sync",
          syncMetadata: {
            deviceId: input.deviceId,
            syncVersion: input.syncVersion,
            todosCount: input.todos.length,
          },
          isAutoSync: true,
        };

        // First verify the user exists in the database
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found in database",
          });
        }

        const backupFile = await ctx.db.backupFile.create({
          data: {
            ...backupData,
            userId: ctx.session.user.id,
          },
        });

        return { success: true, backupFile };
      } catch (error) {
        console.error("Push changes error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to push changes: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Get latest backup for sync status
  getLatestBackup: protectedProcedure.query(async ({ ctx }) => {
    try {
      const latestBackup = await ctx.db.backupFile.findFirst({
        where: {
          userId: ctx.session.user.id,
          isActive: true,
          category: "auto-sync",
        },
        orderBy: { createdAt: "desc" },
      });

      return { latestBackup };
    } catch (error) {
      console.error("Error getting latest backup:", error);
      return { latestBackup: null };
    }
  }),

  // Pull changes from other devices
  pullChanges: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        lastSyncTimestamp: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // Find newer backups from other devices
        const newerBackups = await ctx.db.backupFile.findMany({
          where: {
            userId: ctx.session.user.id,
            isActive: true,
            category: "auto-sync",
            createdAt: { gt: new Date(input.lastSyncTimestamp) },
            deviceId: { not: input.deviceId }, // Exclude current device
          },
          orderBy: { createdAt: "asc" },
        });

        return { backups: newerBackups };
      } catch (error) {
        console.error("Error pulling changes:", error);
        return { backups: [] };
      }
    }),

  // Get backup data for restoration
  getBackupData: protectedProcedure
    .input(z.object({ backupId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const backup = await ctx.db.backupFile.findFirst({
          where: {
            id: input.backupId,
            userId: ctx.session.user.id,
            isActive: true,
          },
        });

        if (!backup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Backup not found",
          });
        }

        // Extract data from the data URL
        if (backup.fileUrl.startsWith("data:application/json;base64,")) {
          const base64Data = backup.fileUrl.replace(
            "data:application/json;base64,",
            "",
          );
          const jsonString = Buffer.from(base64Data, "base64").toString();
          const data = JSON.parse(jsonString);
          return { data };
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid backup format",
          });
        }
      } catch (error) {
        console.error("Error getting backup data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get backup data",
        });
      }
    }),
});
