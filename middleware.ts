export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/account", "/en/account", "/login", "/register", "/en/login", "/en/register"],
};
