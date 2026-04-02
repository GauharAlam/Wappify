import { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | Wappify",
  description: "Sign in to your Wappify merchant dashboard.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* ── Background decoration ────── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-500/10 via-background to-background" />
      
      {/* ── Logo ────────────────────── */}
      <Link href="/" className="relative z-10 mb-8 flex h-16 items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <MessageSquare className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-bold tracking-tight">Wappify</span>
          <span className="text-xs font-medium text-muted-foreground">
            Commerce Dashboard
          </span>
        </div>
      </Link>

      {/* ── Login Form ──────────────── */}
      <div className="relative z-10 w-full max-w-[420px]">
        <LoginForm />
      </div>

      {/* ── Footer ──────────────────── */}
      <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground/60">
        &copy; 2026 Wappify SaaS. All rights reserved. Built with ❤️ for D2C Brands.
      </p>
    </div>
  );
}
