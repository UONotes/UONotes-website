import Image from "next/image";

type EventCardProps = {
  title: string;
  date: string;
  imageSrc: string;
};

export function EventCard({ title, date, imageSrc }: EventCardProps) {
  return (
    <div className="event-card">
      <div className="event-thumb">
        <Image src={imageSrc} alt={title} fill style={{ objectFit: "cover" }} />
      </div>
      <div className="event-info">
        <p className="event-title">{title}</p>
        <p className="event-date">{date}</p>
        <button className="btn-outline-sm">Learn more</button>
      </div>
    </div>
  );
}