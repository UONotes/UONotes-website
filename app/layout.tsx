import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AccessGate } from "@/components/Auth/AccessGate";

export const metadata: Metadata = {
  title: "UONotes",
  description: "Notes made by students, for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen relative overflow-x-hidden">
        {/* Slow Moving Background Layer */}
        <div className="fixed inset-0 pointer-events-none z-0 animated-grid-bg" />

        <AccessGate>
          <AppShell>
            {children}
          </AppShell>
        </AccessGate>
      </body>
    </html>
  );
}