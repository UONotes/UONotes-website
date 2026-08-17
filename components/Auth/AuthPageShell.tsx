import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";

type AuthPageShellProps = {
  children: ReactNode;
};

export function AuthPageShell({
  children,
}: AuthPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-pink">
      <div className="w-full shrink-0">
        <Navbar />
      </div>

      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}