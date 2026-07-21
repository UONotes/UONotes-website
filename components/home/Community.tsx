import Link from "next/link";
import { TrendingUpIcon, UsersIcon, BookOpenIcon } from "../icons";

export function Community() {
  const stats = [
    { icon: <TrendingUpIcon />, value: "100,000+", label: "Interactions" },
    { icon: <UsersIcon />,      value: "100+",     label: "Contributors" },
    { icon: <BookOpenIcon />,   value: "10",       label: "Faculties covered" },
  ];

  return (
    <section className="section-wrapper">
      <div className="grid grid-cols-1 min-[900px]:grid-cols-[280px_1fr] gap-8 min-[900px]:gap-[80px] items-center max-w-[1000px] mx-auto">
        <div className="flex flex-col gap-5">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="text-[1.25rem]">{s.icon}</span>
              <div>
                <p className="text-[clamp(1.25rem,2vw,1.75rem)] font-bold text-brand-dark leading-tight">{s.value}</p>
                <p className="text-[clamp(0.85rem,1.2vw,1rem)] text-brand-muted leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="font-logo text-[clamp(1.4rem,2.5vw,2rem)] font-semibold text-brand-dark tracking-tight leading-[1.35] mb-6">
            Join a growing community of students supporting each other academically.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn-outline">Contact us</Link>
            <Link href="/about" className="btn-outline">Meet the team</Link>
          </div>
        </div>
      </div>
    </section>
  );
}