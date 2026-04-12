import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);
export { auth as middleware };

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/en/account",
    "/en/account/:path*",
    "/login",
    "/register",
    "/en/login",
    "/en/register",
  ],
};
