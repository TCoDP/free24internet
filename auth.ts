import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { authorizeCredentials } = await import(
          /* webpackIgnore: true */
          "@/lib/auth/authorize-credentials"
        );
        return authorizeCredentials(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.email) token.email = user.email;
        token.name = user.name ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.email = String(token.email ?? session.user.email ?? "");
        session.user.name =
          typeof token.name === "string" && token.name.length > 0 ? token.name : null;
      }
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isEn = pathname.startsWith("/en/");
      const loginPath = isEn ? "/en/login" : "/login";
      const registerPath = isEn ? "/en/register" : "/register";
      const accountPath = isEn ? "/en/account" : "/account";

      if (pathname === accountPath) {
        if (!auth?.user) {
          const url = request.nextUrl.clone();
          url.pathname = loginPath;
          url.searchParams.set("next", pathname);
          return NextResponse.redirect(url);
        }
        return true;
      }

      if (pathname === loginPath || pathname === registerPath) {
        if (auth?.user) {
          const url = request.nextUrl.clone();
          url.pathname = accountPath;
          url.search = "";
          return NextResponse.redirect(url);
        }
      }

      return true;
    },
  },
});
