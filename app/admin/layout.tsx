"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, FileText, Settings, ShieldAlert, BookOpen, Flag, ArrowLeft } from "lucide-react";

const ADMIN_NAV = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Review Queue", href: "/admin/queue", icon: FileText },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Reports", href: "/admin/reports", icon: Flag },
  { name: "Guidelines", href: "/admin/guidelines", icon: BookOpen },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full bg-gray-50/50 text-gray-900 font-sans overflow-hidden">
      
      {/* Sleek, modern sidebar */}
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all border border-gray-100/80 shadow-xs"
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
                    ? "text-brand-red bg-brand-red/5" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-red" : "text-gray-400"}`} />
                {item.name}

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div 
                    layoutId="admin-active-pill"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-red"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-gray-100/80">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              JA
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">Jack (VP)</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">jack@uonotes.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace with Smooth Page Transitions */}
      <main className="flex-1 h-full overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-10 max-w-7xl mx-auto min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}