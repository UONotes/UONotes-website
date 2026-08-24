import { QueueTable } from "@/components/admin/QueueTable";
import { AdminNote } from "@/lib/admin";

export default async function AdminQueuePage() {
  // TODO: Replace with secure database fetch. Ensure user is ADMIN.
  const mockQueue: AdminNote[] = [
    { id: "note_1", title: "Midterm Formula Sheet", courseCode: "MAT1348", uploaderEmail: "student1@uottawa.ca", submittedAt: "10 mins ago", status: "PENDING" },
    { id: "note_2", title: "Lecture 1-4 Notes", courseCode: "CSI2110", uploaderEmail: "student2@uottawa.ca", submittedAt: "1 hour ago", status: "UNDER_REVIEW", claimedBy: "jack@uonotes.com" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Review Queue</h1>
        <p className="text-sm text-gray-500 font-mono mt-1">{mockQueue.length} items in pipeline</p>
      </div>
      <QueueTable notes={mockQueue} />
    </div>
  );
}