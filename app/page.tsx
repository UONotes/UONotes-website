import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedNotes } from "@/components/home/FeaturedNotes";
import { Events } from "@/components/home/Events"; 
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { Community } from "@/components/home/Community";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen overflow-hidden text-gray-900">
      <Hero />
      <HowItWorks />
      <FeaturedNotes />
      <Events /> 
      <SponsorsSection />
      <Community />
    </div>
  );
}