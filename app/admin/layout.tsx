"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  ShieldAlert, 
  BookOpen, 
  ArrowLeft, 
  Menu, 
  X 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_NAV = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Review Queue", href: "/admin/queue", icon: FileText },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Guidelines", href: "/admin/guidelines", icon: BookOpen },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchAdminData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const email = user.email || "admin@uonotes.com";
        const rawName = user.user_metadata?.full_name || email.split("@")[0];
        
        const displayName = user.user_metadata?.full_name 
          ? rawName 
          : rawName.split(/[._-]/).map((chunk: string) => chunk.charAt(0).toUpperCase() + chunk.slice(1)).join(" ");
          
        const initials = displayName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        setAdminProfile({
          name: displayName,
          email: email,
          initials: initials || "AD",
        });
      }
    }

    fetchAdminData();
  }, [supabase]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50/50 text-gray-900 font-sans overflow-hidden">
      
      {/* ==========================================
          MOBILE TOP APP BAR (< md)
      ========================================== */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-gray-100 shrink-0 z-30">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-brand-red" />
          <span className="font-logo font-bold text-base tracking-tight">Admin Console</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ==========================================
          MOBILE NAVIGATION DRAWER OVERLAY (No Animation Lag)
      ========================================== */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 flex flex-col justify-between border-r border-gray-100 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="px-2">
              <Link
                href="/"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
                Return to UONotes
              </Link>
            </div>

            <nav className="flex flex-col gap-1">
              <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                Platform Management
              </div>
              {ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? "text-brand-red bg-brand-red/5 font-bold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-red" : "text-gray-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Profile Card */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-2xl mt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm uppercase">
                {adminProfile?.initials || "..."}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-900 truncate">{adminProfile?.name || "Loading..."}</p>
                <p className="text-[10px] text-gray-400 font-mono truncate">{adminProfile?.email || "Fetching..."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DESKTOP SIDEBAR (hidden on mobile)
      ========================================== */}
      <aside className="hidden md:flex w-[260px] bg-white border-r border-gray-100 shrink-0 flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100/80">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-red" />
            <span className="font-logo font-bold text-lg tracking-tight">Admin Console</span>
          </div>
        </div>

        {/* Return to Main Site Button */}
        <div className="px-3 pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all border border-gray-100/80 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
            Return to UONotes
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
            Platform Management
          </div>
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? "text-brand-red bg-brand-red/5 font-bold" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-red" : "text-gray-400"}`} />
                {item.name}

                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-red" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-gray-100/80">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm uppercase tracking-wider">
              {adminProfile?.initials || "..."}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">
                {adminProfile?.name || "Loading..."}
              </p>
              <p className="text-[10px] text-gray-400 font-mono truncate">
                {adminProfile?.email || "Fetching profile..."}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT WORKSPACE (Instant & Unblocked)
      ========================================== */}
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="p-6 sm:p-10 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}