import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

// Match everything except static assets and public landing pages
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|favicon.ico|$).*)"],
};
