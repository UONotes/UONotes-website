"use client";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 w-full flex-grow flex flex-col min-h-[calc(100vh-72px)] py-8 px-4 sm:px-6 overflow-y-auto">
      <main className="flex-grow flex flex-col w-full max-w-2xl mx-auto justify-center my-auto">
        {children}
      </main>
    </div>
  );
}