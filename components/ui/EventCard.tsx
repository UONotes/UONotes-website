import Image from "next/image";

export function EventCard({ title, date, imageSrc }: { title: string; date: string; imageSrc: string; }) {
  return (
    <div className="custom-card">
      <div className="relative h-[140px]">
        <Image src={imageSrc} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      </div>
      <div className="p-3 pb-3.5">
        <p className="text-sm font-semibold text-brand-dark mb-1 leading-snug">{title}</p>
        <p className="text-xs text-brand-muted mb-2.5">{date}</p>
        <button className="btn-outline-sm">Learn more</button>
      </div>
    </div>
  );
}