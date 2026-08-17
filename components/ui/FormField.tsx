import type { InputHTMLAttributes } from "react";

type FormFieldProps = {
  id: string;
  label: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function FormField({
  id,
  label,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-normal text-brand-dark"
      >
        {label}
      </label>

      <input
        id={id}
        className="h-[30px] w-full min-w-0 rounded border border-brand-border-light bg-white px-3 text-sm text-brand-dark outline-none placeholder:text-[11px] placeholder:text-gray-400 focus:border-brand-red"
        {...inputProps}
      />
    </div>
  );
}