import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Только то, что безопасно для Edge / middleware: без DB и без Credentials authorize.
 * Провайдеры и логика входа — в `auth.ts`.
 */
export default {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.tgUsername = user.tgUsername ?? null;
      }
      return token;
    },
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
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isEn = pathname.startsWith("/en/");
      const loginPath = isEn ? "/en/login" : "/login";
      const registerPath = isEn ? "/en/register" : "/register";
      const accountBase = isEn ? "/en/account" : "/account";
      const accountDefault = `${accountBase}/profile`;
      const adminBase = isEn ? "/en/admin" : "/admin";
      const isAdminArea =
        pathname === adminBase || pathname.startsWith(`${adminBase}/`);
      const isAccountArea =
        pathname === accountBase ||
        pathname.startsWith(`${accountBase}/`);

      if (isAdminArea) {
        if (!auth?.user) {
          const url = request.nextUrl.clone();
          url.pathname = loginPath;
          url.searchParams.set("next", pathname);
          return NextResponse.redirect(url);
        }
        return true;
      }

      if (isAccountArea) {
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
          url.pathname = accountDefault;
          url.search = "";
          return NextResponse.redirect(url);
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
