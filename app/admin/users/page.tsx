import { UserListTable } from "@/components/admin/UserListTable";
import { AdminUser } from "@/lib/admin";
import { Search, Filter } from "lucide-react";

export default async function AdminUsersPage() {
  // TODO: Secure Server-side fetch.
  const mockUsers: AdminUser[] = [
    { id: "usr_1", name: "Caira Nobert", email: "caira@uottawa.ca", role: "STUDENT", status: "ACTIVE", joinedAt: "Sep 2024", submissionCount: 12 },
    { id: "usr_2", name: "Jack (VP)", email: "jack@uonotes.com", role: "ADMIN", status: "ACTIVE", joinedAt: "Jan 2024", submissionCount: 45 },
    { id: "usr_3", name: "Spam Bot", email: "scammer@fake.com", role: "STUDENT", status: "BANNED", joinedAt: "Oct 2025", submissionCount: 0 },
  ];

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage platform users, roles, and access.</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-shadow shadow-sm"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm shrink-0">
          <Filter className="w-4 h-4 text-gray-500" />
          Filters
        </button>
      </div>

      {/* Table Component */}
      <UserListTable initialUsers={mockUsers} />
    </div>
  );
}