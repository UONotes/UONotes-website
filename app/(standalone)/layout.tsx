"use client";

import { useEffect } from "react";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Only lock body scroll on desktop (min-width: 768px) where fixed height is enforced
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.body.classList.add("lock-scroll");
      } else {
        document.body.classList.remove("lock-scroll");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.classList.remove("lock-scroll");
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative z-10 w-full flex-grow flex flex-col md:h-[calc(100vh-72px)] md:max-h-[calc(100vh-72px)] overflow-y-auto md:overflow-hidden">
      <main className="flex-grow flex flex-col w-full h-full overflow-y-auto md:overflow-hidden">
        {children}
      </main>
    </div>
  );
}