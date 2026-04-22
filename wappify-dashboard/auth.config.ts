import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: any, request: { nextUrl: any } }) {
      const isLoggedIn = !!auth?.user;

      // Public routes that don't require authentication
      const isPublicRoute = 
        nextUrl.pathname === "/" || 
        nextUrl.pathname === "/login" || 
        nextUrl.pathname === "/register" ||
        nextUrl.pathname.startsWith("/blog");

      // Public API routes — only auth, webhooks, and registration
      const isPublicApiRoute =
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/api/webhooks") ||
        nextUrl.pathname.startsWith("/api/webhook") ||
        nextUrl.pathname.startsWith("/api/register");

      if (isPublicRoute || isPublicApiRoute) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
