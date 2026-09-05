"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAdminRoute = pathname?.startsWith("/admin");

  // Pages where you want to hide the footer
  const standalonePaths = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-signup",
    "/callback",
    "/delete-account",
    "/contact"
  ];

  const isStandaloneRoute = standalonePaths.some((path) => pathname?.startsWith(path));

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Navbar stays permanently mounted at the root. It will NEVER reload or flash again! */}
      <Navbar />
      
      <main className="flex-1 flex flex-col w-full relative z-10">
        {children}
      </main>

      {/* Footer hides on standalone/contact pages, but Navbar stays untouched */}
      {!isStandaloneRoute && <Footer />}
    </>
  );
}