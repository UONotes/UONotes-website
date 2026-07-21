import Image from "next/image";
import Marquee from "react-fast-marquee";

const SPONSORS = [
  { name: "Pure Yoga", src: "/images/Pure-Yoga-Logo.png" },
  { name: "Pizza Pizza", src: "/images/PizzaPizza-Logo.png" },
  { name: "Crumbl Cookies", src: "/images/Crumbl-Cookies-Logo.png" },
  { name: "Metcalfe", src: "/images/Metcalfe-Logo.png" },
  { name: "Red Bull", src: "/images/RedBull-Logo.png" },
  { name: "Haunted Walk", src: "/images/Haunted-Walk-Logo.png" },
];

export function SponsorsSection() {
  return (
    <section className="section-wrapper text-center">
      <h2 className="section-title">Thank you to our sponsors!</h2>
      <div className="w-full mb-8 overflow-hidden">
        <Marquee speed={40} gradient={false} pauseOnHover autoFill>
          {SPONSORS.map((s, i) => (
            <div key={i} className="relative flex items-center justify-center mx-4 w-[140px] h-[60px] md:w-[200px] md:h-[96px] shrink-0">
              <Image src={s.src} alt={s.name} fill sizes="200px" className="object-contain" />
            </div>
          ))}
        </Marquee>
      </div>
      <div className="flex gap-3 justify-center">
        <a href="#" className="btn-outline">Become a sponsor</a>
        <a href="#" className="btn-outline">Why sponsor UONotes?</a>
      </div>
    </section>
  );
}