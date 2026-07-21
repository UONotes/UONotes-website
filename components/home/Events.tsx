import { EventCard } from "../ui/EventCard";

export function Events() {
  return (
    <section className="section-wrapper">
      <h2 className="section-title text-brand-red">Events</h2>
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 gap-5">
        <EventCard title="Pathways to Dentistry, Medicine & Law" date="June 19th, 2026" imageSrc="/images/Image-1.png" />
        <EventCard title="Trivia Night" date="March 19th, 2026" imageSrc="/images/Image-2.png" />
        <EventCard title="F1 Movie Night" date="February 27th, 2026" imageSrc="/images/event pic.png" />
      </div>
    </section>
  );
}