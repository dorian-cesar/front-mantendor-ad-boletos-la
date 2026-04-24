import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Film, X, Check, Video, ChevronDown, ChevronUp, Hash } from "lucide-react";

interface VideoSelectorProps {
  videos: any[];
  empresas: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function VideoSelector({ videos, empresas, selectedIds, onChange }: VideoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return videos;
    const s = search.toLowerCase();
    return videos.filter((v: any) =>
      v.nombre?.toLowerCase().includes(s) ||
      v.id?.toString().toLowerCase().includes(s)
    );
  }, [videos, search]);

  const selectedVideos = useMemo(
    () => videos.filter((v: any) => selectedIds.some(sid => String(sid) === String(v.id))),
    [videos, selectedIds]
  );

  const toggleVideo = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const idStr = String(id);
    if (selectedIds.some(sid => String(sid) === idStr)) {
      onChange(selectedIds.filter((sid) => String(sid) !== idStr));
    } else {
      onChange([...selectedIds, idStr]);
    }
  };

  const removeVideo = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((sid) => String(sid) !== String(id)));
  };

  return (
    <div className="space-y-3" ref={dropdownRef}>
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Film size={12} className="text-blue-500" />
          Contenido Multimedia
        </label>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full shadow-sm">
          {selectedIds.length} video{selectedIds.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 bg-slate-50 border transition-all rounded-2xl text-sm font-semibold shadow-sm ${
            isOpen 
              ? "border-blue-500 ring-4 ring-blue-500/10 bg-white" 
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-100/50"
          }`}
        >
          <div className="flex items-center gap-2 text-slate-700">
            <Video size={18} className={selectedIds.length > 0 ? "text-blue-600" : "text-slate-400"} />
            <span>
              {selectedIds.length === 0 
                ? "Seleccionar videos..." 
                : `${selectedIds.length} videos seleccionados`}
            </span>
          </div>
          {isOpen ? <ChevronUp size={18} className="text-blue-600" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute z-[60] mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o ID..."
                  value={search}
                  autoFocus
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
              {filtered.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <Video size={24} className="text-slate-200" />
                  <p className="text-xs text-slate-400 font-medium">
                    {videos.length === 0 ? "No hay videos en la librería" : "Sin coincidencias"}
                  </p>
                </div>
              ) : (
                filtered.map((v: any) => {
                  const isSelected = selectedIds.some(sid => String(sid) === String(v.id));
                  const empresa = empresas.find(e => String(e.id) === String(v.empresa_id));
                  
                  return (
                    <div
                      key={v.id}
                      onClick={(e) => toggleVideo(v.id, e)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-blue-50/50 cursor-pointer group/item ${
                        isSelected ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                            : "border-slate-200 group-hover/item:border-blue-400 bg-white"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold truncate ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                            {v.nombre}
                          </span>
                          <span className="text-[9px] font-black text-slate-300 uppercase flex items-center gap-0.5">
                            <Hash size={8} /> {String(v.id).substring(0,6)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {empresa && (
                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {empresa.nombre}
                            </span>
                          )}
                          {v.descripcion && (
                            <span className="text-[10px] text-slate-400 truncate group-hover/item:text-slate-500 transition-colors">
                              {v.descripcion}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${v.status === true ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-300'}`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected videos explicit list */}
      {selectedVideos.length > 0 && (
        <div className="pt-5 mt-4 border-t border-slate-100">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            Videos a Exhibir ({selectedVideos.length})
          </label>
          <div className="space-y-2">
            {selectedVideos.map((v: any) => {
              const empresa = empresas.find((e) => String(e.id) === String(v.empresa_id));
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Video size={14} />
                    </div>
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 truncate">{v.nombre}</span>
                        {empresa && (
                          <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded-sm uppercase tracking-tighter shrink-0 border border-indigo-100/50">
                            {empresa.nombre}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Hash size={10} /> {v.id.toString().substring(0, 8)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 mr-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const idx = selectedIds.findIndex((sid) => String(sid) === String(v.id));
                          if (idx > 0) {
                            const newIds = [...selectedIds];
                            [newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]];
                            onChange(newIds);
                          }
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title="Subir en el orden"
                      >
                        <ChevronUp size={14} strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const idx = selectedIds.findIndex((sid) => String(sid) === String(v.id));
                          if (idx < selectedIds.length - 1 && idx !== -1) {
                            const newIds = [...selectedIds];
                            [newIds[idx + 1], newIds[idx]] = [newIds[idx], newIds[idx + 1]];
                            onChange(newIds);
                          }
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title="Bajar en el orden"
                      >
                        <ChevronDown size={14} strokeWidth={3} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeVideo(v.id, e)}
                      className="p-2 shrink-0 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-200"
                      title="Eliminar de la exhibición"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
