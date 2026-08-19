import Image from "next/image";
import Marquee from "react-fast-marquee";
import { SPONSORS } from "@/lib/sponsors-data";

export function SponsorsSection() {
  return (
    <section className="section-wrapper text-center">
      <h2 className="section-title">Thank you to our sponsors!</h2>
      
      <div className="w-full mb-8 overflow-hidden">
        <Marquee speed={40} gradient={false} pauseOnHover autoFill>
          {SPONSORS.map((sponsor, index) => (
            <div key={index} className="relative flex items-center justify-center mx-4 w-[140px] h-[60px] md:w-[200px] md:h-[96px] shrink-0">
              <Image 
                src={sponsor.imageUrl} 
                alt={sponsor.name} 
                fill 
                sizes="200px" 
                className="object-contain" 
                priority // Still mandatory to bypass Next.js lazy-loading inside the Marquee
              />
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