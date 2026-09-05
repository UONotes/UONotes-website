import { ContactSection } from "@/components/contact/ContactSection";

export default function ContactPage() {
  return (
    // Removed h-, max-h-, and overflow-hidden.
    // Also removed p-0, m-0, box-border as Tailwind's preflight handles these globally.
    <div className="w-full text-gray-900">
      <ContactSection />
    </div>
  );
}