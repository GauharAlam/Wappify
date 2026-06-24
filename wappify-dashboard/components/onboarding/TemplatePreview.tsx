import * as React from "react";
import { UseCaseTemplate } from "@/lib/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, Tag, Bot } from "lucide-react";

interface TemplatePreviewProps {
  template: UseCaseTemplate;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-neutral-100 shadow-sm">
        <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Workflow className="h-4 w-4 text-blue-500" />
            Auto-Configured Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {template.defaultRules.map((rule, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-neutral-100 bg-white">
                <div>
                  <p className="font-medium text-sm text-neutral-900">{rule.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    <span className="font-semibold text-neutral-700">Triggers on: </span>
                    {rule.trigger === "KEYWORD" ? rule.keywords.join(", ") : rule.trigger}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                    Action: {rule.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="border-neutral-100 shadow-sm">
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-500" />
              Default Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {template.defaultTags.map((tag, idx) => (
                <div 
                  key={idx} 
                  className="px-2 py-1 rounded-md text-xs font-medium border"
                  style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}30` }}
                >
                  {tag.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-100 shadow-sm">
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-500" />
              AI Personality
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-xs text-neutral-600 leading-relaxed italic border-l-2 border-purple-200 pl-3">
              &quot;{template.defaultAiContext}&quot;
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
