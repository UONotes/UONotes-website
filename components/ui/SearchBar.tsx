import { SearchIcon } from "../icons";

export function SearchBar({ placeholder = "Search for courses, notes, and other documents." }: { placeholder?: string }) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-white rounded-full pl-5 pr-12 py-3 text-sm text-brand-dark placeholder:text-brand-muted border border-brand-border-light focus:outline-none focus:border-brand-red transition-colors"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <SearchIcon />
      </span>
    </div>
  );
}
