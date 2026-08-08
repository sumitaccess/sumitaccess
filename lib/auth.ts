import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, getUserById, touchUser, updateUser } from "./users";
import { newId, nowIso } from "./ids";
import { STARTER_CREDITS } from "./constants";
import { awardCredits } from "./credits";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = getUserByEmail(credentials.email);
        if (!user) return null;
        if (user.status === "SUSPENDED") return null;
        if (!user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        // Email verification is required before the first sign-in.
        if (!user.emailVerified) return null;
        touchUser(user.id);
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Upsert the OAuth user into our database so sessions resolve to a DB id.
        let dbUser = getUserByEmail(user.email);
        if (!dbUser) {
          dbUser = createUser({
            name: user.name || user.email.split("@")[0] || "New Member",
            email: user.email,
            passwordHash: null,
            image: user.image,
          });
          awardCredits(dbUser.id, STARTER_CREDITS, "BONUS", "Welcome to SkillSwap — 3 starter credits 🎉");
        } else if (dbUser.status === "SUSPENDED") {
          return false;
        }
        // Google already verified this email — mark the account verified.
        if (!dbUser.emailVerified) {
          updateUser(dbUser.id, { emailVerified: nowIso() });
        }
        // Propagate the DB id through the token.
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.uid = user.id;
        token.name = user.name;
        token.picture = user.image ?? null;
      }
      if (account?.provider === "google" && token.email && !token.uid) {
        const dbUser = getUserByEmail(String(token.email));
        if (dbUser) token.uid = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.uid || token.sub || "");
      }
      return session;
    },
  },
};

// Re-export with minimal typing used across the app.
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export { newId, nowIso, getUserById };
