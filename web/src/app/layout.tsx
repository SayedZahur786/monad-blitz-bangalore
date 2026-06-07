import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "We-WhoCares — Explainable AI claims on Monad",
  description:
    "Every AI health-insurance claim decision explained in plain language and recorded immutably on the Monad blockchain.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border bg-white">
            <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted">
              We-WhoCares · Built for transparent, IRDAI-aligned claims · Audit trail on Monad testnet
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
