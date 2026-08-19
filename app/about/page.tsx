import { AboutHero } from "@/components/about/AboutHero";
import { FoundersSection } from "@/components/about/FoundersSection";
import { AllTeamsSection } from "@/components/about/AllTeamsSection";
import { TeamSelector } from "@/components/about/TeamSelector";

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center w-full py-16 px-4 max-w-6xl mx-auto">
      <AboutHero />
      <AllTeamsSection/>
    </div>
  );
}