import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactSection } from "@/components/contact/ContactSection";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
