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
    <section className="section sponsors">
      <h2 className="section-title red">Thank you to our sponsors!</h2>
      <div className="sponsors-marquee-wrapper">
        <Marquee speed={40} gradient={false} pauseOnHover autoFill>
          {SPONSORS.map((s, i) => (
            <div key={i} className="sponsor-logo">
              <Image src={s.src} alt={s.name} fill sizes="200px" style={{ objectFit: "contain" }} />
            </div>
          ))}
        </Marquee>
      </div>
      <div className="sponsor-actions">
        <a href="https://forms.google.com" target="_blank" rel="noopener" className="btn-outline">
          Become a sponsor
        </a>
        <a href="/sponsorship-package.pdf" target="_blank" rel="noopener" className="btn-outline">
          Why sponsor UONotes?
        </a>
      </div>
    </section>
  );
}