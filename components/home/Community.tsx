import Link from "next/link";
import { TrendingUpIcon, UsersIcon, BookOpenIcon } from "../icons";

export function Community() {
  const stats = [
    { icon: <TrendingUpIcon />, value: "1,500,000+", label: "Interactions" },
    { icon: <UsersIcon />,      value: "100+",     label: "Contributors" },
    { icon: <BookOpenIcon />,   value: "10",        label: "Faculties covered" },
  ];

  return (
    <section className="section community">
      <div className="community-inner">
        <div className="community-stats">
          {stats.map((s) => (
            <div key={s.label} className="stat-row">
              <span className="stat-icon">{s.icon}</span>
              <div>
                <p className="stat-value">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="community-cta">
          <h2 className="community-heading">
            Join a growing community of students supporting each other academically.
          </h2>
          <div className="community-actions">
            <Link href="/contact" className="btn-outline">Contact us</Link>
            <Link href="/about" className="btn-outline">Meet the team</Link>
          </div>
        </div>
      </div>
    </section>
  );
}