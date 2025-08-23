import { publicProcedure, createTRPCRouter } from "@/server/api/trpc";
import { z } from "zod";
import Binance from "binance-api-node";

type Trade = {
  id: number;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
};

export const binanceRouter = createTRPCRouter({
  allTrades: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }): Promise<Trade[]> => {
      const client = Binance();
      return (await client.trades({ symbol: input.symbol })).map((trade) => ({
        id: trade.id,
        side: trade.isBuyerMaker ? "BUY" : "SELL",
        price: Number(trade.price),
        qty: Number(trade.qty),
      }));
    }),
});
