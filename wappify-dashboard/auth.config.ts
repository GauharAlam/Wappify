import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // This is a placeholder. Real logic will be in auth.ts
        // which includes the database adapter.
        return null;
      },
    }),
  ],
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
