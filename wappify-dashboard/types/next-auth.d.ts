import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      merchantId: string | null;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    merchantId?: string | null;
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    merchantId?: string | null;
    role?: UserRole;
  }
}
