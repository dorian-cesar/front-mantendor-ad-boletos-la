import React from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Activo")
    return (
      <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-900 uppercase shadow-sm">
        Activo
      </span>
    );
  if (status === "Inactivo")
    return (
      <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-200 uppercase">
        Inactivo
      </span>
    );
  if (status === "Error" || status === "Error Físico" || status === "Desconectado")
    return (
      <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-300 uppercase shadow-sm">
        Con Error
      </span>
    );
  return null;
}
