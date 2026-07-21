import Link from "next/link";

export function Hero() {
  return (
    <section className="text-center px-6 pt-20 pb-16">
      <h1 className="font-logo text-[clamp(3rem,6vw,5rem)] font-semibold text-brand-red tracking-tight mb-4">
        Welcome to UONotes
      </h1>
      <p className="text-[clamp(1.1rem,1.8vw,1.4rem)] text-brand-body italic mb-10">
        Notes made by students, for students.
      </p>
      <div className="flex justify-center flex-wrap gap-8 md:gap-12 mb-10">
        <Link href="/submit" className="btn-primary">Submit notes</Link>
        <Link href="/notes" className="btn-primary">View notes</Link>
        <Link href="/dashboard" className="btn-primary">My dashboard</Link>
      </div>
      <p className="text-[clamp(0.95rem,1.2vw,1.1rem)] text-brand-body leading-relaxed max-w-[600px] mx-auto">
        A student-driven platform making academic resources more accessible across all faculties at the University of Ottawa.
      </p>
    </section>
  );
}