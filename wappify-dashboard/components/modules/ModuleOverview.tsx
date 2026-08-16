import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModuleDefinition } from "@/modules/platform/module-config";

type ModuleOverviewProps = {
  module: ModuleDefinition;
  metrics: Array<{ label: string; value: string; hint: string }>;
  nextSteps: Array<{ title: string; description: string; href: string }>;
};

export function ModuleOverview({ module, metrics, nextSteps }: ModuleOverviewProps) {
  const Icon = module.icon;

  return (
    <div className="space-y-7 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-7 shadow-sm sm:px-8">
        <div className={`absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full opacity-10 ${module.accent}`} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white ${module.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Wappify {module.label}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{module.label} workspace</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Modular workspace
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-xl shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Start here</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {nextSteps.map((step) => (
              <Link key={step.href} href={step.href} className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/70">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{step.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{step.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-dashed shadow-none">
          <CardContent className="flex min-h-56 flex-col justify-between p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Clock3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">A focused workspace, built in stages</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Core workflows are live today. Advanced controls are being added in the module navigation without disrupting your existing data.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
