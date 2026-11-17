import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Celebrating YOU — Curated Celebration Marketplace",
  description: "The premier full-stack platform for booking verified event photographers, caterers, bakers, decorators, and celebration artisans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800 bg-slate-50 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
