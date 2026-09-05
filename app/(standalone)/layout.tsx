"use client";

import { useEffect } from "react";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Automatically lock body scroll when entering any standalone route
    document.body.classList.add("lock-scroll");
    
    // Automatically restore normal scrolling when navigating away
    return () => {
      document.body.classList.remove("lock-scroll");
    };
  }, []);

  return (
    <div className="relative z-10 w-full flex-grow flex flex-col h-[calc(100vh-72px)] max-h-[calc(100vh-72px)] overflow-hidden">
      <main className="flex-grow flex flex-col w-full h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}