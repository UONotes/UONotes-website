"use client";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. Swapped vh to dvh (again, standard practice for mobile).
    <div className="relative z-10 w-full flex-grow flex flex-col min-h-[calc(100dvh-72px)] overflow-y-auto">
      {/* 
        2. REMOVED max-w-2xl, mx-auto, justify-center, and my-auto.
        3. Now, it is just a fluid canvas. The child pages (Contact, Auth) will dictate their own widths.
      */}
      <main className="flex-grow flex flex-col w-full">
        {children}
      </main>
    </div>
  );
}