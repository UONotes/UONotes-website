import { Shield, ShieldCheck, Crown } from "lucide-react";
import { ROLE_LABEL, type AdminRole } from "@/lib/admin";

const STYLE: Record<Exclude<AdminRole, "STUDENT">, { className: string; icon: typeof Shield }> = {
  SUPER_ADMIN: { className: "bg-brand-red text-white", icon: Crown },
  VP_NOTES: { className: "bg-brand-dark text-white", icon: ShieldCheck },
  ADMIN: { className: "bg-brand-pink text-brand-red", icon: Shield },
};

// One badge style for every role, used anywhere a person's role is shown.
export function RoleBadge({ role }: { role: AdminRole }) {
  if (role === "STUDENT") return <span className="text-xs text-brand-muted">{ROLE_LABEL.STUDENT}</span>;
  const { className, icon: Icon } = STYLE[role];
  return (
    <span className={`inline-flex items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-semibold leading-none whitespace-nowrap ${className}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{ROLE_LABEL[role]}</span>
    </span>
  );
}
