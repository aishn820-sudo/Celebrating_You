import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Celebrating YOU — Every Celebration. One Place.",
  description: "You Imagine the Celebration. We Bring Everything Together. Connect with trusted event service providers and vendors through one unified celebration marketplace.",
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
