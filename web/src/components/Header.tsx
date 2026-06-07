"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-border bg-white p-0.5 text-xs font-medium">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            lang === l ? "bg-primary text-white" : "text-muted hover:text-foreground",
          )}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("dashboard") },
    { href: "/history", label: t("history") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="We-WhoCares"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-contain shadow-sm"
            priority
          />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-foreground">{t("appName")}</div>
            <div className="hidden text-[11px] text-muted sm:block">Explainable claims · on Monad</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href ? "bg-blue-50 text-primary" : "text-muted hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <div className="hidden items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-3 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
              DU
            </span>
            <span className="text-xs font-medium text-foreground">{t("demoUser")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
