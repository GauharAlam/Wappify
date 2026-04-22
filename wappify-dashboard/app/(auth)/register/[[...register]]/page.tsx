"use client";

import Link from "next/link";
import Image from "next/image";
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#fafafa] px-4 py-12 sm:px-6 lg:px-8">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-500/5 blur-[120px]" />
      </div>

      {/* Branding Section */}
      <Link href="/" className="relative z-10 mb-10 flex flex-col items-center gap-4 group transition-transform hover:scale-105 duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-primary to-green-500 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
            <Image
              src="/logo.svg"
              alt="Wappify Logo"
              width={56}
              height={56}
              className="relative rounded-2xl bg-white p-1 shadow-sm"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">
              Wappify
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
              Commerce Dashboard
            </span>
          </div>
        </div>
      </Link>

      {/* Clerk Register Container */}
      <div className="relative z-10 w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SignUp
          path="/register"
          routing="path"
          signInUrl="/login"
          fallbackRedirectUrl="/onboarding"
          signInFallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case shadow-none",
              card: "shadow-2xl border border-neutral-100 rounded-2xl",
              headerTitle: "text-2xl font-bold tracking-tight",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-neutral-200 hover:bg-neutral-50 transition-colors",
              footerActionLink: "text-primary hover:text-primary/90 font-semibold",
              formFieldInput: "rounded-xl border-neutral-200 focus:border-primary focus:ring-primary",
            },
          }}
        />
      </div>

      <p className="relative z-10 mt-12 text-center text-[10px] font-medium uppercase tracking-widest text-neutral-400">
        Business setup continues after sign up so we can create your store profile safely.
      </p>
    </div>
  );
}
