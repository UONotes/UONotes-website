import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedNotes } from "@/components/home/FeaturedNotes";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { Community } from "@/components/home/Community";
import { createClient } from "@/lib/supabase/server";
// Revalidate this page every 1 hour (3600 seconds)
// Featured notes don't change by the second. Don't waste Supabase database reads on every single homepage visit.
export const revalidate = 3600; 

export default async function HomePage() {
const supabase = await createClient();
  // Fetch the 4 most recent approved notes
  // Adjust "notes", "course_code", and "status" to match your exact database schema
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, course_code")
    .eq("status", "approved") 
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    // In a strict production environment, you'd pipe this to Sentry or an alerting system.
    console.error("Failed to fetch featured notes:", error.message);
  }

  return (
    <div className="w-full min-h-screen overflow-hidden text-gray-900">
      <Hero />
      <HowItWorks />
      
      {/* Pass the real Supabase payload into the client component */}
      <FeaturedNotes notes={notes || []} />
      
      <SponsorsSection />
      <Community />
    </div>
  );
}