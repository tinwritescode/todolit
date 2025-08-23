import { binanceRouter } from "@/server/api/routers/binance";
import { tokenRouter } from "@/server/api/routers/token";
import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { englishToolsRouter } from "./routers/english-tools";
import { projectRouter } from "./routers/project";
import { todoRouter } from "./routers/todo";
import { promptRouter } from "./routers/prompt";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  todo: todoRouter,
  project: projectRouter,
  englishTools: englishToolsRouter,
  binance: binanceRouter,
  token: tokenRouter,
  prompt: promptRouter,
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
