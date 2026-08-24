"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        layout
        layoutId="auth-morph-box"
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{
          layout: { duration: 0.25, ease: "easeInOut" },
          opacity: { duration: 0.15, ease: "easeOut" }
        }}
        className="w-full max-w-md sm:max-w-lg bg-white border border-brand-red/15 p-6 sm:p-10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}