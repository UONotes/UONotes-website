import type { InputHTMLAttributes } from "react";

type FormFieldProps = {
  id: string;
  label: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function FormField({ id, label, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
      </label>
      <input
        id={id}
        className="w-full bg-[#fdfafb] border border-brand-red/20 rounded-md px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all shadow-sm"
        {...inputProps}
      />
    </div>
  );
}