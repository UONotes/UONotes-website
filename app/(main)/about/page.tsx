import { AboutHero } from "@/components/about/AboutHero";
import { FoundersSection } from "@/components/about/FoundersSection";
import { TeamSelector } from "@/components/about/TeamSelector";

export default function AboutPage() {
  return (
    <div className="flex w-full flex-col items-center">
      <AboutHero />
      <FoundersSection />
      <TeamSelector />
    </div>
  );
}