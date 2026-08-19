import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

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
      <body className="antialiased bg-[#fdfafb] flex flex-col min-h-screen">
        {/* The Navbar sits at the top of the DOM tree, outside the page routing */}
        <Navbar />
        
        {/* The dynamic page content is injected here */}
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
        
        {/* The Footer anchors the bottom */}
        <Footer />
      </body>
    </html>
  );
}