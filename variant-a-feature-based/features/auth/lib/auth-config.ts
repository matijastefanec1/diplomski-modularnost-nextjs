import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import type {} from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/shared/lib/prisma";

import { credentialsSchema } from "./credentials-schema";
import { normalizeEmail } from "./email";

declare module "next-auth/jwt" {
  interface JWT {
    playerId: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // bez adaptera baze, sesija je u JWT cookieju
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Lozinka", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        // auth ne smije uvoziti players, pa sam radi upit i svoju kopiju normalizacije
        const player = await prisma.player.findUnique({
          where: { email: normalizeEmail(parsed.data.email) },
          select: { id: true, name: true, passwordHash: true },
        });

        if (!player) {
          return null;
        }

        const passwordMatches = await compare(
          parsed.data.password,
          player.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        return { id: player.id, name: player.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // token se gradi ispočetka pri prijavi
      if (user?.id) {
        return { playerId: user.id, name: user.name };
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.playerId;
      session.user.name = token.name ?? "";

      return session;
    },
  },
});
