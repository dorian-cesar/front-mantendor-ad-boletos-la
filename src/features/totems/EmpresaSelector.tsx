import React, { useState, useMemo } from "react";
import { Search, Building, X, Check } from "lucide-react";

interface EmpresaSelectorProps {
  empresas: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function EmpresaSelector({ empresas, selectedIds, onChange }: EmpresaSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return empresas;
    return empresas.filter((e: any) =>
      e.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      e.rut?.toLowerCase().includes(search.toLowerCase())
    );
  }, [empresas, search]);

  const selectedEntries = useMemo(
    () => empresas.filter((e: any) => selectedIds.includes(e.id)),
    [empresas, selectedIds]
  );

  const toggleEmpresa = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeEmpresa = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Building size={13} />
          Empresas Asignadas
        </label>
        <span className="text-[10px] font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
          {selectedIds.length} seleccionada{selectedIds.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Selected entreprises chips */}
      {selectedEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedEntries.map((e: any) => (
            <span
              key={e.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-semibold transition-all hover:bg-slate-200"
            >
              <Building size={11} />
              <span className="max-w-[150px] truncate">{e.nombre}</span>
              <button
                onClick={() => removeEmpresa(e.id)}
                className="p-0.5 rounded-md hover:bg-slate-300 text-slate-500 hover:text-slate-800 transition-colors ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search size={14} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar empresa por nombre o RUT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50 focus:bg-white transition-all shadow-sm"
        />
      </div>

      {/* Empresa list */}
      <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-50 shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs font-medium">
            {empresas.length === 0 ? "No hay empresas disponibles" : "Sin resultados para la búsqueda"}
          </div>
        ) : (
          filtered.map((e: any) => {
            const isSelected = selectedIds.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => toggleEmpresa(e.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all hover:bg-slate-50 group/item ${
                  isSelected ? "bg-slate-50" : ""
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-900/10"
                      : "border-slate-300 text-transparent group-hover/item:border-slate-900"
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-semibold block truncate ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                    {e.nombre}
                  </span>
                  {e.rut && (
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {e.rut}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                    e.status === 'Activo'
                      ? "bg-slate-100 text-slate-900 border border-slate-200"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                  {e.status}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
