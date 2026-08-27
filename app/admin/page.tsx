import Link from "next/link";
import { FileText, Users, Flag, ShieldAlert, ArrowRight, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function AdminOverviewPage() {
  // TODO: Replace with real aggregated database fetches
  const stats = {
    pendingReviews: 3,
    activeReports: 2,
    totalUsers: 1240,
    flaggedNotes: 1,
  };

  const recentQueue = [
    { id: "note_1", title: "Midterm Formula Sheet", courseCode: "MAT1348", uploader: "student1@uottawa.ca", time: "10 mins ago" },
    { id: "note_2", title: "Lecture 1-4 Notes", courseCode: "CSI2110", uploader: "student2@uottawa.ca", time: "1 hour ago" },
    { id: "note_3", title: "Final Exam Prep Guide", courseCode: "ITI1120", uploader: "student3@uottawa.ca", time: "2 hours ago" },
  ];

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">System Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform telemetry, pending workloads, and moderation status.</p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.pendingReviews}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Active Reports</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.activeReports}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Flag className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.totalUsers}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Flagged Content</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.flaggedNotes}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* QUICK ACTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Priority Queue Preview */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Priority Review Queue</h2>
              <p className="text-xs text-gray-400">Oldest unreviewed submissions requiring moderation.</p>
            </div>
            <Link 
              href="/admin/queue" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:underline"
            >
              View all queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-50 flex-1">
            {recentQueue.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-4 h-4 text-brand-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{item.courseCode} • Uploaded by {item.uploader}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">{item.time}</span>
                  <Link 
                    href={`/admin/review/${item.id}`}
                    className="px-3.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick System Health / Status */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">System Health</h2>
            <p className="text-xs text-gray-400 mb-6">Database, storage, and edge API nodes.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Database Connection</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Optimal (12ms)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">PDF Storage Bucket</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Middleware Security</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50">
            <div className="bg-brand-red/5 rounded-2xl p-4 border border-brand-red/10">
              <p className="text-xs font-bold text-brand-red mb-1">UONotes Club Notice</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Midterm season is active. Expect a high volume of document submissions over the next 48 hours.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}