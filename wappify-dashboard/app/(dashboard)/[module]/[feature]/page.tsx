import Link from "next/link";
import { ArrowLeft, Construction, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getModuleByKey } from "@/modules/platform/module-config";

export default async function ModuleFeaturePage({ params }: { params: Promise<{ module: string; feature: string }> }) {
  const { module: moduleKey, feature } = await params;
  const productModule = getModuleByKey(moduleKey);
  const route = `/${moduleKey}/${feature}`;
  const featureItem = productModule?.navigation.find((item) => item.href === route);

  if (!productModule || !featureItem) notFound();

  const Icon = productModule.icon;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <Link href={productModule.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to {productModule.label}
      </Link>
      <Card className="overflow-hidden rounded-2xl shadow-none">
        <CardContent className="relative p-7 sm:p-10">
          <div className={`absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full opacity-10 ${productModule.accent}`} />
          <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-white ${productModule.accent}`}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="relative mt-7 inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Construction className="h-3.5 w-3.5" />
            In the modular build
          </span>
          <h1 className="relative mt-4 text-3xl font-semibold tracking-tight">{featureItem.label}</h1>
          <p className="relative mt-3 max-w-xl text-sm leading-6 text-muted-foreground">This dedicated {productModule.label.toLowerCase()} workspace is planned as part of Wappify’s modular platform. The route is in place now so navigation, permissions, data contracts, and UI can grow without another migration.</p>
          <div className="relative mt-8 flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            Existing live workflows remain available from the module navigation.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
