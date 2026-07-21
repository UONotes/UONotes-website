import Link from "next/link";

export function Hero() {
  return (
    <section className="hero">
      <h1 className="hero-title">Welcome to UONotes</h1>
      <p className="hero-subtitle">Notes made by students, for students.</p>
      <div className="hero-actions">
        <Link href="/submit" className="btn-primary">Submit notes</Link>
        <Link href="/notes" className="btn-primary">View notes</Link>
        <Link href="/dashboard" className="btn-primary">My dashboard</Link>
      </div>
      <p className="hero-description">
        A student-driven platform making academic resources more accessible across
        all faculties at the University of Ottawa.
      </p>
    </section>
  );
}