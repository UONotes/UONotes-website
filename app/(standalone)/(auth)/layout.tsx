"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // We aggressively reduce the vertical padding (py-12 down to py-4) on short screens.
    <div className="w-full min-h-[calc(100dvh-80px)] flex flex-col items-center py-12 [@media(max-height:750px)]:py-4 px-4 isolate">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          opacity: { duration: 0.25, ease: "easeOut" },
          y: { duration: 0.25, ease: "easeOut" }
        }}
        // We compress the inner padding of the card on short screens to save another ~24px of vertical space.
        className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-10 [@media(max-height:750px)]:p-6 my-auto shadow-none ring-0 bg-transparent"
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