import { SearchIcon } from "@/components/icons";

export function SearchBar({ placeholder = "Search for courses, notes, and other documents." }: { placeholder?: string }) {
  return (
    <div className="relative max-w-2xl w-full">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-white rounded-xl pl-5 pr-14 py-4 text-base text-gray-900 placeholder:text-gray-400 border border-brand-red/20 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all shadow-sm"
      />
      <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <SearchIcon className="w-6 h-6" />
      </span>
    </div>
  );
}