"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type AuthPageShellProps = {
  children: ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col bg-[#fef5f6]">
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full flex justify-center"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}