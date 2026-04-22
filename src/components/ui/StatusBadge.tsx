import React from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Activo")
    return (
      <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-emerald-200 uppercase">
        Activo
      </span>
    );
  if (status === "Inactivo")
    return (
      <span className="bg-slate-100/80 text-slate-600 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-slate-200 uppercase">
        Inactivo
      </span>
    );
  if (status === "Error" || status === "Error Físico" || status === "Desconectado")
    return (
      <span className="bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-rose-200 uppercase">
        Con Error
      </span>
    );
  return null;
}
