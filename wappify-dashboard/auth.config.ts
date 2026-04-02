import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isPublicRoute = 
        nextUrl.pathname === "/login" || 
        nextUrl.pathname === "/register" ||
        nextUrl.pathname.startsWith("/api/webhooks"); // Webhooks must stay public

      if (isPublicRoute || isApiRoute) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
