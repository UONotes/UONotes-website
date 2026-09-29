import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChangesRequestedNotice } from "@/components/notes/ChangesRequestedNotice";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.uonotes.ca"),
  title: "UONotes",
  description: "Bilingual student notes and academic organization for uOttawa.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icon-512.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: [{ url: "/apple-icon-180.png?v=3", sizes: "180x180" }],
  },
  openGraph: {
    title: "UONotes",
    description: "Bilingual student notes and academic organization for uOttawa.",
    images: ["/logo2.png?v=2"],
  },
  twitter: {
    card: "summary",
    title: "UONotes",
    description: "Bilingual student notes and academic organization for uOttawa.",
    images: ["/logo2.png?v=2"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        {/* Navbar stays mounted globally and never reloads */}
        <Navbar />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <Footer />
        <Analytics />
        <ChangesRequestedNotice />
      </body>
    </html>
  );
}