import React from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Activo")
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-emerald-600 uppercase shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        Activo
      </span>
    );
  if (status === "Inactivo")
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-600 uppercase shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        Inactivo
      </span>
    );
  if (status === "Desconectado")
    return (
      <span className="inline-flex items-center gap-1.5 bg-slate-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-600 uppercase shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        Desconectado
      </span>
    );
  if (status === "Error" || status === "Error Físico")
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-700 uppercase shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        Con Error
      </span>
    );
  return null;
}
