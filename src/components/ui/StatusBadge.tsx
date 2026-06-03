import React from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Activo")
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-emerald-200 uppercase shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Activo
      </span>
    );
  if (status === "Inactivo")
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Inactivo
      </span>
    );
  if (status === "Desconectado")
    return (
      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-300 uppercase shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
        Desconectado
      </span>
    );
  if (status === "Error" || status === "Error Físico")
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-200 uppercase shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
        Con Error
      </span>
    );
  return null;
}
