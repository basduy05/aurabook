import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuraBook - Next-Gen AI Platform",
  description:
    "AuraBook Monorepo platform built with Next.js 15, FastAPI, PostgreSQL, and Redis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased bg-slate-950 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
