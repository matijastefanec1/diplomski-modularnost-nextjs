import NextAuth, { AuthError } from "next-auth";
// prazan type import, bez njega tsc ne vidi augmentaciju (TS2664)
import type {} from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import type { VerifyCredentials } from "@/src/application/use-cases/verify-credentials";

declare module "next-auth/jwt" {
  interface JWT {
    playerId: string;
  }
}

export type SignInWithCredentialsInput = {
  email: string;
  password: string;
  redirectTo: string;
};

export function createAuth(verifyCredentials: VerifyCredentials) {
  const {
    handlers,
    auth,
    signIn: nextAuthSignIn,
    signOut,
  } = NextAuth({
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
          const { email, password } = rawCredentials;

          if (typeof email !== "string" || typeof password !== "string") {
            return null;
          }

          const player = await verifyCredentials.execute({ email, password });

          return player === null ? null : { id: player.id, name: player.name };
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

  async function signIn(input: SignInWithCredentialsInput): Promise<boolean> {
    try {
      await nextAuthSignIn("credentials", input);

      return true;
    } catch (error) {
      if (error instanceof AuthError) {
        return false;
      }

      throw error;
    }
  }

  return { handlers, auth, signIn, signOut } as const;
}
