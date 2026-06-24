import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UseCaseTemplate } from "@/lib/templates";
import { CheckCircle2, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface TemplateCardProps {
  template: UseCaseTemplate;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  // Dynamically resolve icon from Lucide
  const Icon = (LucideIcons as any)[template.icon] || LucideIcons.LayoutTemplate;

  return (
    <Card 
      onClick={onClick}
      className={`group cursor-pointer relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 ${
        isSelected ? "border-primary bg-primary/5" : "border-neutral-100 hover:border-primary/30"
      }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 text-primary animate-in fade-in zoom-in">
          <CheckCircle2 className="h-6 w-6" />
        </div>
      )}

      <CardContent className="p-6">
        <div className={`inline-flex p-3 rounded-xl mb-4 ${isSelected ? "bg-primary text-primary-foreground" : "bg-neutral-100 text-neutral-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors"}`}>
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold mb-2 text-neutral-900 group-hover:text-primary transition-colors">
          {template.name}
        </h3>
        
        <p className="text-sm text-neutral-500 mb-6 min-h-[40px]">
          {template.description}
        </p>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Perfect for:</p>
          <ul className="text-sm text-neutral-600 space-y-1">
            {template.exampleUseCases.map((useCase, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                {useCase}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300">
          Preview Template <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
