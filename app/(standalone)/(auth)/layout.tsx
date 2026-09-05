"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-4 isolate">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          opacity: { duration: 0.25, ease: "easeOut" },
          y: { duration: 0.25, ease: "easeOut" }
        }}
        // Added 'isolate' to the parent and 'shadow-none ring-0' here to completely kill any inherited shadows
        className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-10 overflow-hidden shadow-none ring-0 bg-transparent"
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