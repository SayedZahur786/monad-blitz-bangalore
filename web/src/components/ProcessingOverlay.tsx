"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Full-screen processing overlay shown during the AI -> blockchain flow.
 * `step`: 1 = AI analysing, 2 = generating reasons, 3 = recording on Monad, 4 = done.
 */
export function ProcessingOverlay({ step }: { step: number }) {
  const { t } = useI18n();
  const items = [
    { n: 1, label: t("procAI") },
    { n: 2, label: t("procReasons") },
    { n: 3, label: t("procChain") },
    { n: 4, label: t("procDone") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-7 shadow-xl animate-fade-up">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl text-white">
            ✓
          </span>
          <div>
            <div className="font-semibold text-foreground">{t("processing")}</div>
            <div className="text-xs text-muted">{t("appName")}</div>
          </div>
        </div>

        <ul className="space-y-3">
          {items.map((it) => {
            const done = step > it.n;
            const active = step === it.n;
            return (
              <li key={it.n} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    done
                      ? "bg-accent text-white"
                      : active
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-muted",
                  )}
                >
                  {done ? "✓" : active ? <Spinner /> : it.n}
                </span>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    active ? "font-medium text-foreground" : done ? "text-muted" : "text-slate-400",
                  )}
                >
                  {it.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
