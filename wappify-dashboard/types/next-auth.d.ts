import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      merchantId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    merchantId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    merchantId?: string | null;
  }
}
