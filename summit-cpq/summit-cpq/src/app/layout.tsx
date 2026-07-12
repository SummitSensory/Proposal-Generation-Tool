import type { Metadata } from "next";
import "./globals.css";
import NavShell from "@/components/NavShell";
import { getSession } from "@/lib/auth/session";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Summit Sensory Gym | Internal CPQ",
  description: "Internal proposal, pricing, and project platform for Summit Sensory Gym.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <NavShell session={session}>{children}</NavShell>
        <Analytics />
      </body>
    </html>
  );
}
