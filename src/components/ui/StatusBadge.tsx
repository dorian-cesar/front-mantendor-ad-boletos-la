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
  if (status === "Desconectado")
    return (
      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-slate-300 uppercase shadow-sm">
        Desconectado
      </span>
    );
  if (status === "Error" || status === "Error Físico")
    return (
      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-200 uppercase shadow-sm">
        Con Error
      </span>
    );
  return null;
}
