"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce"; 

export function UserSearchControls({ initialQuery, initialRole }: { initialQuery: string, initialRole: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [text, setText] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(text, 300);

  // Sync local text state if URL query param changes externally (e.g. browser back/forward)
  useEffect(() => {
    const currentQueryParam = searchParams.get("q") || "";
    if (text !== currentQueryParam) {
      setText(currentQueryParam);
    }
  }, [searchParams]);

  // Trigger router replacement ONLY when debouncedQuery changes and differs from initialQuery
  useEffect(() => {
    if (debouncedQuery === initialQuery) return; 

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    } else {
      params.delete("q");
    }
    params.set("page", "1"); 

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [debouncedQuery, initialQuery, pathname, router, searchParams]); 

  const handleRoleChange = (newRole: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newRole === "ALL") {
      params.delete("role");
    } else {
      params.set("role", newRole);
    }
    params.set("page", "1");
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const roles = [
    { label: "All Users", value: "ALL" },
    { label: "Admins", value: "ADMIN" },
    { label: "Students", value: "STUDENT" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-3xl border border-gray-100 shadow-xs">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by full name or email address..." 
          className="w-full pl-11 pr-10 py-2.5 bg-gray-50/60 hover:bg-gray-50 focus:bg-white border border-gray-200/80 rounded-2xl text-xs font-medium text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all placeholder:text-gray-400"
        />
        {isPending ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        ) : text ? (
          <button 
            type="button"
            onClick={() => setText("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[11px] font-mono font-bold"
          >
            CLEAR
          </button>
        ) : null}
      </div>
      
      {/* CUSTOM LUXURY PILL SELECTOR INSTEAD OF CHROME NATIVE DROPDOWN */}
      <div className="flex items-center gap-1 bg-gray-50/80 p-1 rounded-2xl border border-gray-100">
        {roles.map((r) => {
          const isActive = initialRole === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRoleChange(r.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive 
                  ? "bg-white text-gray-900 shadow-xs border border-gray-200/60" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 border border-transparent"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}