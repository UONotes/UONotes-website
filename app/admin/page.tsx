import Link from "next/link";
import { 
  FileText, Users, Flag, ShieldAlert, ArrowRight, 
  Clock, CheckCircle2, AlertOctagon, 
  ExternalLink, Layers, Database, HardDrive, Bell,
  Sparkles, Activity, ShieldCheck, Zap, UserCheck, Award
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (diffInSec < 60) return `${diffInSec}s ago`;
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  return `${Math.floor(diffInSec / 86400)}d ago`;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch current logged-in admin user and their profile details
  const { data: { user } } = await supabase.auth.getUser();
  let adminName = "Administrator";
  let adminEmail = user?.email || "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();
    
    if (profile?.email) {
      adminEmail = profile.email;
      // Extract a clean display name from the email prefix (e.g., "john.doe@..." -> "John Doe")
      const prefix = profile.email.split("@")[0];
      adminName = prefix
        .split(/[._-]/)
        .map((chunk: string) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ");
    }
  }

  // 2. Parallel database execution for queue telemetry and personal performance stats
  const [
    { count: pendingCount },
    { count: flaggedCount },
    { count: userCount },
    { count: approvedCount },
    { count: personalReviewedCount },
    { data: queueItems },
    { data: settingsData }
  ] = await Promise.all([
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "approved"),
    // Count notes reviewed by this specific logged-in admin
    user ? supabase.from("notes").select("*", { count: "exact", head: true }).eq("reviewed_by", user.id) : Promise.resolve({ count: 0 }),
    supabase
      .from("notes")
      .select("id, title, course_code, created_at, status, flag_reason")
      .in("status", ["pending", "flagged"])
      .order("created_at", { ascending: true })
      .limit(6),
    supabase.from("platform_settings").select("announcement_banner").single()
  ]);

  const urgentCount = (pendingCount ?? 0) + (flaggedCount ?? 0);
  const isHealthy = urgentCount === 0;
  const activeAnnouncement = settingsData?.announcement_banner;

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 font-sans text-gray-900 animate-in fade-in duration-500 relative">
      
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* SETTINGS BROADCAST BANNER */}
      {activeAnnouncement && activeAnnouncement.trim() !== "" && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-3xl p-5 flex items-center justify-between gap-4 text-amber-950 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">Admin Broadcast Notice</p>
              <p className="text-xs font-semibold text-amber-950 mt-0.5">{activeAnnouncement}</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono bg-amber-100 text-amber-800 px-2.5 py-1 rounded-xl border border-amber-200">
            Global Notice
          </span>
        </div>
      )}

      {/* 1. Personalized Header & Live Platform Status Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Command Center
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-mono text-gray-400">{adminEmail || "Authorized Personnel"}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back, {adminName}</h1>
          <p className="text-xs text-gray-500 max-w-xl">
            Here is your live moderation telemetry and system backlog overview.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border shadow-2xs transition-all ${
          isHealthy 
            ? "bg-emerald-50/80 text-emerald-800 border-emerald-100 shadow-emerald-500/5" 
            : "bg-amber-50/80 text-amber-800 border-amber-100 shadow-amber-500/5"
        }`}>
          {isHealthy ? (
            <div className="w-6 h-6 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          )}
          <span>{isHealthy ? "All Moderation Queues Clear" : `${urgentCount} Action Items Requiring Attention`}</span>
        </div>
      </div>

      {/* 2. Key Metrics Bento Grid (Featuring Personal Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Pending Backlog" 
          value={pendingCount ?? 0} 
          icon={Clock} 
          badge={pendingCount ? "Needs Action" : "Clear"} 
          variant={pendingCount ? "warning" : "neutral"} 
        />
        <MetricCard 
          label="Flagged Risks" 
          value={flaggedCount ?? 0} 
          icon={ShieldAlert} 
          badge={flaggedCount ? "Reports Open" : "Secure"} 
          variant={flaggedCount ? "danger" : "neutral"} 
        />
        <MetricCard 
          label="Your Reviews" 
          value={personalReviewedCount ?? 0} 
          icon={UserCheck} 
          badge="Personal Metric" 
          variant="success" 
        />
        <MetricCard 
          label="Total Profiles" 
          value={userCount ?? 0} 
          icon={Users} 
          badge="Registered" 
          variant="neutral" 
        />
      </div>

      {/* 3. Main Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Priority Worklist (Unified Queue & Flagged) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">Backlog Stream</h2>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              </div>
              <p className="text-base font-black text-gray-900 tracking-tight mt-0.5">Moderation Priority Queue</p>
            </div>
            <Link 
              href="/admin/queue" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200/80 text-xs font-bold uppercase tracking-wider text-gray-700 transition-colors shadow-2xs"
            >
              Full Worklist <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1">
            {!queueItems || queueItems.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-900">Queue is immaculate</p>
                <p className="text-xs text-gray-400 font-mono">No documents currently pending or flagged for review.</p>
              </div>
            ) : (
              queueItems.map((item: any) => {
                const isFlagged = item.status === "flagged";

                return (
                  <div key={item.id} className="p-5 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-4 group">
                    <div className="flex items-start gap-4 min-w-0">
                      <span className={`shrink-0 px-3 py-1.5 text-xs font-mono font-bold rounded-xl shadow-2xs mt-0.5 border ${
                        isFlagged 
                          ? "bg-purple-50 border-purple-100 text-purple-700" 
                          : "bg-blue-50 border-blue-100 text-blue-700"
                      }`}>
                        {item.course_code || "GENERIC"}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                          {isFlagged && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                              Flagged Risk
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                          <span>Submitted {formatRelativeTime(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <Link 
                      href={`/admin/review/${item.id}`} 
                      className="shrink-0 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-gray-900/10"
                    >
                      Moderate
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Vitals & Actions */}
        <div className="space-y-6">
          
          {/* Service Integrity Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">System Telemetry</h2>
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-3.5">
              <VitalsRow icon={Database} label="Database Instance" status="Operational" />
              <VitalsRow icon={HardDrive} label="Object Storage (PDFs)" status="Healthy" />
              <VitalsRow icon={ShieldCheck} label="Security Middleware" status="Active" />
            </div>
          </div>

          {/* Operational Actions Launchpad */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-gray-800">
            <div className="space-y-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">Quick Launchpad</h3>
              <p className="text-sm font-bold text-white tracking-tight">Administrative Controls</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <Link 
                href="/admin/queue" 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" /> Review Flagged Risks
                </span>
                <span className="font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-lg font-bold">
                  {flaggedCount ?? 0}
                </span>
              </Link>
              
              <Link 
                href="/admin/users" 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> User Accounts & Roles
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, badge, variant }: {
  label: string;
  value: number;
  icon: any;
  badge: string;
  variant: "neutral" | "warning" | "danger" | "success";
}) {
  const badgeStyles = {
    neutral: "bg-gray-100 text-gray-600 border-gray-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3 transition-all hover:shadow-md group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 transition-transform group-hover:scale-105">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between pt-1">
        <span className="text-3xl font-black font-mono tracking-tight text-gray-900">{value}</span>
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border ${badgeStyles[variant]}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}

function VitalsRow({ icon: Icon, label, status }: { icon: any; label: string; status: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5">
      <div className="flex items-center gap-2.5 text-gray-600">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="font-medium">{label}</span>
      </div>
      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {status}
      </span>
    </div>
  );
}