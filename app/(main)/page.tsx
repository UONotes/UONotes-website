import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedNotes } from "@/components/home/FeaturedNotes";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { Community } from "@/components/home/Community";
import { createClient } from "@/lib/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";

// Revalidate this page every 1 hour (3600 seconds)
// Featured notes don't change by the second. Don't waste Supabase database reads on every single homepage visit.
export const revalidate = 3600; 

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch the 4 most recent approved notes, aliasing course_code to courseCode 
  // to match the FeaturedNote interface expected by the client component.
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, courseCode:course_code, file_key")
    .eq("status", "approved") 
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Failed to fetch featured notes:", error.message);
  }

  // Expiry set well beyond the page's 1hr revalidate window, so a
  // cached page is never served with a URL that's already expired.
  const r2 = createR2Client();
  const notesWithUrls = await Promise.all(
    (notes || []).map(async (note) => ({
      ...note,
      fileUrl: await getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: note.file_key }), { expiresIn: 7200 }),
    }))
  );

  return (
    <div className="w-full min-h-screen overflow-hidden text-gray-900">
      <Hero />
      <HowItWorks />
      
      {/* Pass the real Supabase payload into the client component */}
      <FeaturedNotes notes={notesWithUrls} />
      
      <SponsorsSection />
      <Community />
    </div>
  );
}