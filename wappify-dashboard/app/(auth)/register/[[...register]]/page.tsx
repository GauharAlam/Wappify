"use client";

import Link from "next/link";
import Image from "next/image";
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-500/10 via-background to-background" />

      <Link href="/" className="relative z-10 mb-8 flex h-16 items-center gap-3">
        <Image
          src="/logo.svg"
          alt="Wappify Logo"
          width={48}
          height={48}
          className="rounded-2xl shrink-0"
        />
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-bold tracking-tight">Wappify</span>
          <span className="text-xs font-medium text-muted-foreground">
            Commerce Dashboard
          </span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-[480px]">
        <SignUp
          path="/register"
          routing="path"
          signInUrl="/login"
          fallbackRedirectUrl="/onboarding"
          signInFallbackRedirectUrl="/dashboard"
        />
      </div>

      <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground/60">
        Business setup continues after sign up so we can create your store profile safely.
      </p>
    </div>
  );
}
