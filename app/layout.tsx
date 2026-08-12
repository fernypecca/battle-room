import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Growth Agent Orchestrator — AI Agent Orchestration Demo",
  description:
    "Four AI agents that scrape a competitor's live ads, draft a battlecard, summarize their media coverage, and write an outbound sequence — live, in sequence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
