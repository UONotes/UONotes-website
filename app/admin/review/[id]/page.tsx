import { PdfViewer } from "@/components/admin/PdfViewer";
import { DocumentMetadata } from "@/components/admin/DocumentMetadata";
import { ReviewActionPanel } from "@/components/admin/ReviewActionPanell";

export default async function ReviewRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // TODO: Secure Server-side fetch: verify claim, lock document via OCC
  const note = { id, title: "Midterm Formula Sheet", courseCode: "MAT1348", uploaderEmail: "student1@uottawa.ca", pages: 4 };

  return (
    <div className="w-full h-screen sm:h-[calc(100vh-60px)] flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      
      {/* Left panel: Viewer */}
      <div className="flex-1 flex flex-col bg-gray-900 border-r border-gray-200/20 order-2 md:order-1 h-[50vh] md:h-auto">
        <PdfViewer documentId={id} title={note.title} />
      </div>

      {/* Right panel: Metadata & Actions */}
      <div className="w-full md:w-[380px] bg-white flex flex-col overflow-y-auto shrink-0 order-1 md:order-2">
        <DocumentMetadata note={note} />
        <div className="mt-auto">
          <ReviewActionPanel noteId={id} />
        </div>
      </div>
    </div>
  );
}