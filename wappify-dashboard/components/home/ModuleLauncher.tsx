"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { MODULES, type ModuleDefinition } from "@/modules/platform/module-config";

type ModuleStat = {
  key: ModuleDefinition["key"];
  value: string;
  detail: string;
  isLive?: boolean;
};

export function ModuleLauncher({ stats }: { stats: ModuleStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {MODULES.filter((module) => module.key !== "settings").map((module, index) => {
        const Icon = module.icon;
        const stat = stats.find((entry) => entry.key === module.key);

        return (
          <motion.div
            key={module.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: index * 0.035 }}
          >
            <Link
              href={module.href}
              className="group relative flex min-h-52 flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${module.accent} text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <div className="mt-8">
                <p className="text-base font-semibold tracking-tight">{module.label}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{module.description}</p>
              </div>

              <div className="mt-auto flex items-end justify-between pt-5">
                <div>
                  <p className="text-xl font-semibold tracking-tight">{stat?.value ?? "Set up"}</p>
                  <p className="text-xs text-muted-foreground">{stat?.detail ?? module.metricLabel}</p>
                </div>
                {stat?.isLive && <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Available" />}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
