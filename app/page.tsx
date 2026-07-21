import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedNotes } from "@/components/home/FeaturedNotes";
import { Events } from "@/components/home/Events";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { Community } from "@/components/home/Community";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedNotes />
        <Events />
        <SponsorsSection />
        <Community />
      </main>
      <Footer />
    </>
  );
}