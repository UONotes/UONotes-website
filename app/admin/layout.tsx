"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Users,
  FileStack,
  Settings,
  BookOpen,
  BarChart3,
  History,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminPresenceProvider } from "@/components/admin/AdminPresence";
import { roleOf, ROLE_LABEL, type AdminRole } from "@/lib/admin";

type NavItem = { name: string; href: string; icon: typeof LayoutGrid };

const NAV_GROUPS: { label: string; items: NavItem[]; superAdminOnly?: boolean }[] = [
  {
    label: "Review",
    items: [
      { name: "Overview", href: "/admin", icon: LayoutGrid },
      { name: "Review queue", href: "/admin/queue", icon: FileStack },
      { name: "Decision history", href: "/admin/history", icon: History },
    ],
  },
  {
    label: "Team",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Guidelines", href: "/admin/guidelines", icon: BookOpen },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    label: "Insights",
    superAdminOnly: true,
    items: [{ name: "Analytics", href: "/admin/analytics", icon: BarChart3 }],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  // Stable identity for the live-presence channel (set once per session)
  const [presenceUser, setPresenceUser] = useState<{ id: string; name: string } | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchAdminData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // "*" so a missing role column can't fail the lookup.
      const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      const email = profileRow?.email || user.email || "";
      const displayName =
        profileRow?.full_name ||
        user.user_metadata?.full_name ||
        email
          .split("@")[0]
          .split(/[._-]/)
          .map((chunk: string) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
          .join(" ");

      const initials = displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      setAdminProfile({ name: displayName, email, initials: initials || "UO" });
      setRole(profileRow ? roleOf(profileRow) : null);
      setPresenceUser((prev) => (prev?.id === user.id ? prev : { id: user.id, name: displayName }));
    }

    fetchAdminData();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const groups = NAV_GROUPS.filter((g) => !g.superAdminOnly || role === "SUPER_ADMIN");

  const navigation = (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-brand-pink text-brand-red font-semibold"
                      : "text-brand-body hover:bg-brand-surface hover:text-brand-dark"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-brand-red" : "text-brand-muted"}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-brand-border-light pt-4 space-y-3">
      <div className="flex items-center gap-3 px-1">
        <div className="w-9 h-9 rounded-full bg-brand-red text-white flex items-center justify-center font-semibold text-xs shrink-0">
          {adminProfile?.initials || ""}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-dark truncate">{adminProfile?.name || " "}</p>
          <p className="text-xs text-brand-muted truncate">{role ? ROLE_LABEL[role] : " "}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-brand-body hover:bg-brand-surface transition-colors"
        >
          View site <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handleSignOut}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-brand-body hover:bg-brand-surface transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-auto object-contain" priority />
      <span className="flex flex-col leading-none">
        <span className="font-logo font-bold text-lg text-brand-red tracking-tight">UONotes</span>
        <span className="text-[11px] font-medium text-brand-muted mt-0.5">Desk</span>
      </span>
    </Link>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-brand-surface text-brand-body overflow-hidden">

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-brand-border-light shrink-0 z-30">
        {brand}
        <button
          onClick={() => setIsMobileOpen((open) => !open)}
          className="p-2 -mr-2 text-brand-body hover:text-brand-red"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-white z-40 flex flex-col justify-between p-4 overflow-y-auto">
          {navigation}
          <div className="mt-6">{account}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-brand-border-light shrink-0 flex-col">
        <div className="h-16 flex items-center px-5 border-b border-brand-border-light">{brand}</div>
        <div className="flex-1 overflow-y-auto px-3 py-5">{navigation}</div>
        <div className="px-3 pb-4">{account}</div>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-full overflow-y-auto relative">
        <AdminPresenceProvider user={presenceUser} pathname={pathname}>
          {pathname.startsWith("/admin/review/") || pathname.startsWith("/admin/history/") ? (
            children
          ) : (
            <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto min-h-full">{children}</div>
          )}
        </AdminPresenceProvider>
      </main>
    </div>
  );
}
