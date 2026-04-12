import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { userIsAdmin } from "@/lib/auth/admin-access";
import { authorizeCredentials } from "@/lib/auth/authorize-credentials";
import { getCachedUserProfile } from "@/lib/auth/session-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.email = String(token.email ?? session.user.email ?? "");
        session.user.name =
          typeof token.name === "string" && token.name.length > 0 ? token.name : null;
        session.user.tgUsername =
          typeof token.tgUsername === "string" && token.tgUsername.length > 0
            ? token.tgUsername
            : null;
      }
      try {
        const id = Number(token.id);
        if (Number.isFinite(id) && id > 0) {
          const row = await getCachedUserProfile(id);
          if (row && session.user) {
            session.user.name = row.name?.trim() ? row.name.trim() : null;
            if (row.email) session.user.email = row.email;
            const tg = row.tg_username?.trim();
            session.user.tgUsername = tg && tg.length > 0 ? tg : null;
            session.user.isAdmin = userIsAdmin(row);
          }
        }
      } catch {
        /* JWT без БД */
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => authorizeCredentials(credentials),
    }),
  ],
});
