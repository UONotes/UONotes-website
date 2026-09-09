"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce"; 

export function UserSearchControls({ initialQuery, initialRole }: { initialQuery: string, initialRole: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [text, setText] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(text, 300);

  // Tracks the last value *we* pushed to the URL. When the URL's `q`
  // matches this, the searchParams change we're about to see is just
  // our own request round-tripping back — not a real external change
  // (browser back/forward, a bookmarked link, etc) — so we must not
  // let it overwrite `text`, or fast typing gets its later keystrokes
  // clobbered by the URL update from an earlier one still in flight.
  const lastPushedQuery = useRef(initialQuery);

  useEffect(() => {
    const currentQueryParam = searchParams.get("q") || "";
    if (currentQueryParam !== lastPushedQuery.current) {
      lastPushedQuery.current = currentQueryParam;
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

    lastPushedQuery.current = debouncedQuery.trim();

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
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by name or email" 
          className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-transparent rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-all placeholder:text-gray-400"
        />
        <div className="absolute inset-y-0 right-3.5 flex items-center">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
          ) : text ? (
            <button 
              type="button"
              onClick={() => setText("")}
              className="text-gray-400 hover:text-gray-600 text-xs font-medium"
            >
              Clear
            </button>
          ) : null}
        </div>
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