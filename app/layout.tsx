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
  title: "Competitor Teardown",
  description:
    "Paste a competitor's URL and get what they sell, what they charge, what their customers complain about, and where they are exposed — every claim linked to the source it came from.",
  authors: [{ name: "Fernando Peccatiello" }],
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
