import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "../../../env";

const TokenOutputSchema = z.object({
  id: z.number().int(),
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  chainId: z.number().int(),
  network: z.string().nullable().optional(),
  deployTxHash: z.string(),
  initializeTxHash: z.string().nullable().optional(),
  deployerAddress: z.string(),
  totalSupply: z.string().nullable().optional(),
  ownerPercent: z.number().int().nullable().optional(),
  airdropPercent: z.number().int().nullable().optional(),
  salePercent: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deployedById: z.string(),
});

const TokenListOutputSchema = z.object({
  items: z.array(TokenOutputSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const tokenRouter = createTRPCRouter({
  byId: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .output(TokenOutputSchema)
    .query(async ({ ctx, input }) => {
      const token = await ctx.db.token.findFirst({
        where: { id: input.id, deployedById: ctx.session.user.id },
      });
      if (!token) {
        throw new Error("Token not found");
      }
      return TokenOutputSchema.parse(token);
    }),

  checkVerified: protectedProcedure
    .input(z.object({ address: z.string().min(1) }))
    .output(
      z.object({
        verified: z.boolean(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!env.EXPLORER_API_URL) {
        return { verified: false, message: "EXPLORER_API_URL not set" };
      }
      const params = new URLSearchParams({
        module: "contract",
        action: "getabi",
        address: input.address,
        apikey: env.EXPLORER_API_KEY ?? "",
      });
      const res = await fetch(
        `${env.EXPLORER_API_URL}/api?${params.toString()}`,
      );
      let json: any = undefined;
      try {
        json = await res.json();
      } catch {}
      const resultText = typeof json?.result === "string" ? json.result : "";
      const ok =
        json?.status === "1" && resultText && !/not verified/i.test(resultText);
      const message =
        resultText !== "" ? resultText : (json?.message as string | undefined);
      return { verified: !!ok, message };
    }),
  verify: protectedProcedure
    .input(
      z.object({
        address: z.string().min(1),
        contractName: z.string().default("ERC20Token"),
      }),
    )
    .output(
      z.object({
        ok: z.boolean(),
        status: z.string().nullish(),
        message: z.unknown().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!env.EXPLORER_API_URL) {
        return { ok: false, status: null, message: "EXPLORER_API_URL not set" };
      }

      const flatPath = resolve(
        process.cwd(),
        "assets",
        "ERC20Token_flatten.sol",
      );
      const srcPath = resolve(process.cwd(), "assets", "ERC20Token.sol");
      let sourceCode: string;
      try {
        sourceCode = await readFile(flatPath, "utf8");
      } catch {
        sourceCode = await readFile(srcPath, "utf8");
      }

      const params = new URLSearchParams({
        module: "contract",
        action: "verifysourcecode",
        apikey: env.EXPLORER_API_KEY ?? "",
        contractaddress: input.address,
        sourceCode,
        codeformat: "solidity-single-file",
        contractname: input.contractName,
        compilerversion: env.SOLC_VERSION ?? "v0.8.27",
        optimizationUsed: "1",
        runs: "200",
      });

      const res = await fetch(`${env.EXPLORER_API_URL}/api`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      let json: unknown = undefined;
      try {
        json = await res.json();
      } catch {}
      return {
        ok: res.ok,
        status: (json as any)?.status,
        message: (json as any)?.result,
      };
    }),
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1),
        pageSize: z.number().int().min(1).max(100),
      }),
    )
    .output(TokenListOutputSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      const where = { deployedById: ctx.session.user.id } as const;
      const [total, items] = await Promise.all([
        ctx.db.token.count({ where }),
        ctx.db.token.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return TokenListOutputSchema.parse({ items, total, page, pageSize });
    }),
  create: protectedProcedure
    .input(
      z.object({
        address: z.string().min(1),
        name: z.string().min(1),
        symbol: z.string().min(1),
        chainId: z.number().int(),
        network: z.string().optional(),
        deployTxHash: z.string().min(1),
        initializeTxHash: z.string().optional(),
        deployerAddress: z.string().min(1),
        totalSupply: z.string().optional(),
        ownerPercent: z.number().int().min(0).max(100).optional(),
        airdropPercent: z.number().int().min(0).max(100).optional(),
        salePercent: z.number().int().min(0).max(100).optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
      }),
    )
    .output(TokenOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const token = await ctx.db.token.create({
        data: {
          address: input.address,
          name: input.name,
          symbol: input.symbol,
          chainId: input.chainId,
          network: input.network,
          deployTxHash: input.deployTxHash,
          initializeTxHash: input.initializeTxHash,
          deployerAddress: input.deployerAddress,
          totalSupply: input.totalSupply,
          ownerPercent: input.ownerPercent,
          airdropPercent: input.airdropPercent,
          salePercent: input.salePercent,
          description: input.description,
          imageUrl: input.imageUrl,
          deployedById: ctx.session.user.id,
        },
        select: {
          id: true,
          address: true,
          name: true,
          symbol: true,
          chainId: true,
          network: true,
          deployTxHash: true,
          initializeTxHash: true,
          deployerAddress: true,
          totalSupply: true,
          ownerPercent: true,
          airdropPercent: true,
          salePercent: true,
          description: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
          deployedById: true,
        },
      });
      return TokenOutputSchema.parse(token);
    }),
});
