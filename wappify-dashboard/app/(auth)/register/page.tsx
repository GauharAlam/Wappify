import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Join Wappify | Start 14-day free trial",
  description: "Join Wappify and start selling your products on WhatsApp today.",
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* ── Background decoration ────── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-500/10 via-background to-background" />
      
      {/* ── Logo ────────────────────── */}
      <Link href="/" className="relative z-10 mb-8 flex h-16 items-center gap-3">
        <Image src="/logo.svg" alt="Wappify Logo" width={48} height={48} className="rounded-2xl shrink-0" />
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-bold tracking-tight">Wappify</span>
          <span className="text-xs font-medium text-muted-foreground">
            Commerce Dashboard
          </span>
        </div>
      </Link>

      {/* ── Register Form ───────────── */}
      <div className="relative z-10 w-full max-w-[480px]">
        <RegisterForm />
      </div>

      {/* ── Footer ──────────────────── */}
      <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground/60">
        Already selling? Join thousands of brands on WhatsApp with Wappify.
      </p>
    </div>
  );
}
