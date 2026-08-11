import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "battle-room — AI Agent Orchestration Demo",
  description:
    "Four AI agents that scrape a competitor's live ads, draft a battlecard, summarize their media coverage, and write an outbound sequence — live, in sequence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full">
        <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--background)]/75 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[var(--accent)] text-[10px] font-bold text-white">
                B
              </span>
              battle-room
            </Link>
            <a
              href="https://github.com/fernypecca/battle-room"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              View source ↗
            </a>
          </div>
        </header>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
