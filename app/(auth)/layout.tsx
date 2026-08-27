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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          layout: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
          opacity: { duration: 0.25, ease: "easeOut" },
          y: { duration: 0.25, ease: "easeOut" }
        }}
        className="w-full max-w-md sm:max-w-lg bg-white border border-brand-red/15 p-6 sm:p-10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}