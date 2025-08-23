import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

import { db } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    DiscordProvider,
    Credentials({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      authorize: async (credentials, req) => {
        try {
          if (
            typeof credentials.message !== "string" ||
            typeof credentials.signature !== "string"
          ) {
            throw new Error("Invalid message or signature");
          }

          const rawMessage = credentials.message;
          const signature = credentials.signature;
          const siwe = new SiweMessage(JSON.parse(rawMessage));

          const baseUrl =
            process.env.NEXTAUTH_URL ??
            (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000");
          const nextAuthUrl = new URL(baseUrl);

          // Try to read CSRF token from cookies (App Router compatible)
          const csrfCookie = req?.headers
            ?.get("cookie")
            ?.split("; ")
            .find((c) => c.startsWith("next-auth.csrf-token="));
          const csrfToken = csrfCookie?.split("=")[1]?.split("%7C")[0];

          const result = await siwe.verify({
            signature,
            domain: nextAuthUrl.host,
            nonce: csrfToken ?? siwe.nonce,
          });

          if (result.success) {
            const walletAddress = siwe.address.toLowerCase();

            // Find existing account linked to this wallet
            const existingAccount = await db.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: "ethereum",
                  providerAccountId: walletAddress,
                },
              },
              include: {
                user: true,
              },
            });

            if (existingAccount) {
              return {
                id: existingAccount.userId,
                email: existingAccount.user.email,
                name: existingAccount.user.name,
              };
            }

            // Create a new user and link an account for this wallet
            const newUser = await db.user.create({
              data: {
                name: walletAddress,
              },
            });

            await db.account.create({
              data: {
                userId: newUser.id,
                type: "credentials",
                provider: "ethereum",
                providerAccountId: walletAddress,
              },
            });

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],

  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  callbacks: {
    session: ({ session, user, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: user?.id ?? token?.sub ?? "",
      },
    }),
  },
} satisfies NextAuthConfig;
