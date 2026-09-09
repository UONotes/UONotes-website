"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  FileStack,
  Settings,
  BookOpen,
  BarChart3,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_NAV = [
  { name: "Overview", href: "/admin", icon: LayoutGrid },
  { name: "Review Queue", href: "/admin/queue", icon: FileStack },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Guidelines", href: "/admin/guidelines", icon: BookOpen },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const SUPER_ADMIN_NAV_ITEM = { name: "Analytics", href: "/admin/analytics", icon: BarChart3 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();

  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("is_super_admin")
          .eq("id", user.id)
          .single();
        setIsSuperAdmin(profileRow?.is_super_admin ?? false);
      }
    }

    fetchAdminData();
  }, [supabase]);

  const navItems = isSuperAdmin ? [...ADMIN_NAV, SUPER_ADMIN_NAV_ITEM] : ADMIN_NAV;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#FBF8F3] text-[#23201D] font-sans overflow-hidden">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-black/5 shrink-0 z-30">
        <Link href="/admin" className="flex items-baseline gap-1.5">
          <span className="font-logo font-bold text-lg tracking-tight text-brand-red">UONotes</span>
          <span className="text-[10px] font-medium text-gray-400">Desk</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 flex flex-col justify-between border-r border-black/5 p-4 overflow-y-auto">
          <div className="space-y-4">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 border border-gray-100"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
              Back to the site
            </Link>

            <nav className="flex flex-col gap-0.5 pt-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-lg text-sm font-medium border-l-2 transition-all ${
                      isActive ? "text-brand-red border-brand-red bg-brand-red/[0.04] font-semibold" : "text-gray-600 border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-red" : "text-gray-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3.5 border-t border-gray-100 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-red text-white flex items-center justify-center font-semibold text-xs shrink-0">
                {adminProfile?.initials || "…"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-900 truncate">{adminProfile?.name || "Loading…"}</p>
                <p className="text-[11px] text-gray-400 truncate">{adminProfile?.email || ""}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-[240px] bg-white border-r border-black/5 shrink-0 flex-col relative">
        <div className="h-16 flex items-center px-6 border-b border-black/5">
          <Link href="/admin" className="flex items-baseline gap-1.5">
            <span className="font-logo font-bold text-xl tracking-tight text-brand-red">UONotes</span>
            <span className="text-[11px] font-medium text-gray-400">Desk</span>
          </Link>
        </div>

        <div className="px-4 pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
            Back to the site
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-4 py-5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm border-l-2 transition-all ${
                  isActive
                    ? "text-brand-red border-brand-red bg-brand-red/[0.04] font-semibold"
                    : "text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900 font-medium"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-red" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/5">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-semibold text-[11px] shrink-0">
              {adminProfile?.initials || "…"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {adminProfile?.name || "Loading…"}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {adminProfile?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto relative">
        {pathname.startsWith("/admin/review/") ? (
          children
        ) : (
          <div className="p-6 sm:p-10 max-w-6xl mx-auto min-h-full">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}