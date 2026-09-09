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

  useEffect(() => {
    const currentQueryParam = searchParams.get("q") || "";
    if (text !== currentQueryParam) {
      setText(currentQueryParam);
    }
  }, [searchParams]);

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
    { label: "All", value: "ALL" },
    { label: "Super admins", value: "SUPER_ADMIN" },
    { label: "Admins", value: "ADMIN" },
    { label: "Students", value: "STUDENT" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-black/5">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by name or email" 
          className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-transparent rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-all placeholder:text-gray-400"
        />
        {isPending ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
        ) : text ? (
          <button 
            type="button"
            onClick={() => setText("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
          >
            Clear
          </button>
        ) : null}
      </div>
      
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl overflow-x-auto">
        {roles.map((r) => {
          const isActive = initialRole === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRoleChange(r.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-800"
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