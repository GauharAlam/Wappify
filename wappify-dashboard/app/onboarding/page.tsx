import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { TemplateCard } from "@/components/onboarding/TemplateCard";
import { Button } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth-utils";
import { ONBOARDING_TEMPLATES } from "@/lib/templates";

export const metadata = {
  title: "Onboarding — Wappify",
};

export default async function OnboardingPage() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  // If they are fully onboarded, send to inbox
  if (context.org?.onboardingCompleted) {
    redirect("/inbox");
  }

  return (
    <main className="min-h-screen bg-neutral-50/50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <div className="mb-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight text-neutral-900 text-xl">
            <img src="/logo.svg" alt="Wappify" className="h-8 w-8 rounded-lg" />
            Wappify
          </Link>
          <Button asChild variant="ghost" className="text-neutral-500 hover:text-neutral-900">
            {/* We provide a way to skip using the first template as generic */}
            <Link href="/inbox">
              Skip for now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <section className="mx-auto w-full max-w-3xl py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 1 of 2</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            How will you use Wappify?
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500">
            Choose a use case below. We&apos;ll automatically set up your workflows, tags, and AI personality. <strong className="text-neutral-900 font-medium">You can customize everything later.</strong>
          </p>
        </section>

        <section className="grid gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          {ONBOARDING_TEMPLATES.map((template) => (
            <Link key={template.id} href={`/onboarding/${template.id}`} className="block h-full">
              <TemplateCard template={template} />
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
