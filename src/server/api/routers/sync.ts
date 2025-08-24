import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Create typed uploader
const { uploadFiles } = genUploader<OurFileRouter>();

export const syncRouter = createTRPCRouter({
  // Get sync status and check for new data
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const syncState = await ctx.db.userSyncState.findUnique({
        where: { userId: ctx.session.user.id },
      });

      // Find the latest auto-sync backup
      const latestBackup = await ctx.db.backupFile.findFirst({
        where: {
          userId: ctx.session.user.id,
          isActive: true,
          category: "auto-sync",
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        syncState,
        hasNewData:
          latestBackup?.createdAt && syncState?.lastSyncTimestamp
            ? latestBackup.createdAt > syncState.lastSyncTimestamp
            : false,
        latestBackup,
      };
    } catch (error) {
      console.error("Error getting sync status:", error);
      return {
        syncState: null,
        hasNewData: false,
        latestBackup: null,
      };
    }
  }),

  // Push local changes to cloud
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
        const blob = new Blob([jsonString], { type: "application/json" });

        // Create file with timestamp
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr =
          now.toTimeString().split(" ")[0]?.replace(/:/g, "-") ?? "00-00-00";
        const file = new File([blob], `auto-sync-${dateStr}-${timeStr}.json`, {
          type: "application/json",
        });

        // Upload to UploadThing
        const uploadedFiles = await uploadFiles("backupUploader", {
          files: [file],
        });

        if (uploadedFiles?.[0]) {
          const uploadedFile = uploadedFiles[0];

          // Create backup record
          const backupData = {
            name: `Auto-Sync Backup - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
            description: `Auto-sync from device ${input.deviceId}`,
            fileName: uploadedFile.name,
            fileUrl: uploadedFile.url,
            fileKey: uploadedFile.key ?? `auto-sync-${Date.now()}`,
            fileSize: uploadedFile.size,
            mimeType: uploadedFile.type,
            version: "1.0",
            category: "auto-sync",
            syncMetadata: {
              deviceId: input.deviceId,
              syncVersion: input.syncVersion,
              todosCount: input.todos.length,
            },
            isAutoSync: true,
          };

          const backupFile = await ctx.db.backupFile.create({
            data: {
              ...backupData,
              userId: ctx.session.user.id,
            },
          });

          // Update sync state
          try {
            await ctx.db.userSyncState.upsert({
              where: { userId: ctx.session.user.id },
              update: {
                lastSyncTimestamp: new Date(),
                lastLocalChange: new Date(),
                deviceId: input.deviceId,
                syncVersion: input.syncVersion,
              },
              create: {
                userId: ctx.session.user.id,
                lastSyncTimestamp: new Date(),
                lastLocalChange: new Date(),
                deviceId: input.deviceId,
                syncVersion: input.syncVersion,
              },
            });
          } catch (error) {
            console.error("Failed to update sync state in pushChanges:", error);
            // Don't throw here, just log the error
          }

          return { success: true, backupFile };
        } else {
          throw new Error("No file data received from upload");
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to push changes: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
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
    }),

  // Update sync preferences
  updateSyncState: protectedProcedure
    .input(
      z.object({
        autoSyncEnabled: z.boolean(),
        deviceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First, verify the user exists
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      try {
        const syncState = await ctx.db.userSyncState.upsert({
          where: { userId: ctx.session.user.id },
          update: {
            autoSyncEnabled: input.autoSyncEnabled,
            deviceId: input.deviceId,
            lastLocalChange: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            autoSyncEnabled: input.autoSyncEnabled,
            deviceId: input.deviceId,
            lastLocalChange: new Date(),
          },
        });

        return syncState;
      } catch (error) {
        console.error("Failed to update sync state:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update sync state: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Get current sync state
  getSyncState: protectedProcedure.query(async ({ ctx }) => {
    try {
      const syncState = await ctx.db.userSyncState.findUnique({
        where: { userId: ctx.session.user.id },
      });

      return syncState;
    } catch (error) {
      console.error("Error getting sync state:", error);
      return null;
    }
  }),
});
