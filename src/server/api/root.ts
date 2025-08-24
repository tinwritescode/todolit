import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { englishToolsRouter } from "./routers/english-tools";
import { backupFilesRouter } from "./routers/backup-files";
import { speechToTextRouter } from "./routers/speech-to-text";
import { syncSimpleRouter } from "./routers/sync-simple";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  englishTools: englishToolsRouter,
  backupFiles: backupFilesRouter,
  speechToText: speechToTextRouter,
  sync: syncSimpleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
