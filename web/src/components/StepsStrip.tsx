"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** The 4-step core flow, used on the dashboard and (highlighted) while processing. */
export function StepsStrip({ active = -1 }: { active?: number }) {
  const { t } = useI18n();
  const steps = [
    { n: 1, label: t("step1"), icon: "📝" },
    { n: 2, label: t("step2"), icon: "🤖" },
    { n: 3, label: t("step3"), icon: "⛓️" },
    { n: 4, label: t("step4"), icon: "🔍" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {steps.map((s, i) => {
        const done = active > i;
        const current = active === i;
        return (
          <div
            key={s.n}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              current
                ? "border-primary bg-blue-50"
                : done
                  ? "border-accent/40 bg-emerald-50/60"
                  : "border-border bg-card",
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-accent text-white" : current ? "bg-primary text-white" : "bg-slate-100 text-muted",
                )}
              >
                {done ? "✓" : s.n}
              </span>
              <span aria-hidden className="text-lg">{s.icon}</span>
            </div>
            <div className="text-sm font-medium text-foreground">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
