import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getAuthContext } from "@/lib/auth-utils";
import { ONBOARDING_TEMPLATES } from "@/lib/templates";
import { TemplatePreview } from "@/components/onboarding/TemplatePreview";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export const metadata = {
  title: "Setup Template — Wappify",
};

export default async function TemplateSetupPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  if (context.org?.onboardingCompleted) {
    redirect("/inbox");
  }

  const template = ONBOARDING_TEMPLATES.find((t) => t.id === templateId);

  if (!template) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-50/50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/onboarding" 
            className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            Step 2 of 2
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 items-start pb-20">
          
          {/* Left Side - Template Info & Preview */}
          <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4" />
                Template Selected
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 tracking-tight mb-3">
                {template.name}
              </h1>
              <p className="text-lg text-neutral-500 leading-relaxed">
                {template.description}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">What we&apos;ll auto-configure for you:</h3>
              <TemplatePreview template={template} />
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-2 lg:sticky lg:top-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
            <OnboardingForm 
              templateId={template.id} 
              defaultAiContext={template.defaultAiContext} 
            />
          </div>

        </div>
      </div>
    </main>
  );
}
