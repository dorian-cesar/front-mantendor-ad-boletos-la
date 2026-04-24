import React, { useState, useMemo } from "react";
import { X, Building, Search, PlusCircle, CheckCircle2, Film, ChevronRight, AlertTriangle, Info } from "lucide-react";

interface CompanyVideoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresas: any[];
  videos: any[];
  selectedVideoIds: string[];
  onAddVideos: (ids: string[]) => void;
}

export function CompanyVideoPickerModal({
  isOpen,
  onClose,
  empresas,
  videos,
  selectedVideoIds,
  onAddVideos
}: CompanyVideoPickerModalProps) {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelection, setTempSelection] = useState<string[]>([]);

  // Reset states when opening/closing
  React.useEffect(() => {
    if (isOpen) {
      setSelectedEmpresaId(null);
      setSearchTerm("");
      // Cargamos lo que ya tiene el tótem para poder "quitar" también
      setTempSelection(selectedVideoIds.map(String));
    }
  }, [isOpen, selectedVideoIds]);

  const filteredVideos = useMemo(() => {
    if (!selectedEmpresaId) return [];
    
    return videos.filter(v => 
      String(v.empresa_id) === String(selectedEmpresaId) &&
      (v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       v.id?.toString().includes(searchTerm))
    );
  }, [selectedEmpresaId, videos, searchTerm]);

  const toggleVideo = (id: string) => {
    const idStr = String(id);
    setTempSelection(prev => 
      prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
    );
  };

  const handleConfirm = () => {
    onAddVideos(tempSelection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Building size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Gestionar por Empresa</h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Agrega o quita contenido de un socio específico.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
          
          {/* Step 1: Select Company */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                Paso 1: Selecciona la Empresa
              </label>
              <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {tempSelection.length} videos en total
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto p-1 scrollbar-none">
              {empresas.map(e => {
                const countInSelection = videos.filter(v => String(v.empresa_id) === String(e.id) && tempSelection.includes(String(v.id))).length;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEmpresaId(String(e.id))}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all relative ${
                      selectedEmpresaId === String(e.id)
                        ? "bg-slate-900 border-slate-900 ring-4 ring-slate-900/10 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50/50"
                    }`}
                  >
                    {countInSelection > 0 && (
                      <span className={`absolute top-2 right-2 w-4 h-4 rounded-full ${selectedEmpresaId === String(e.id) ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'} text-[8px] flex items-center justify-center font-bold shadow-sm`}>
                        {countInSelection}
                      </span>
                    )}
                    <Building size={16} className={selectedEmpresaId === String(e.id) ? "text-white" : "text-slate-400"} />
                    <span className="text-[11px] font-bold mt-2 truncate w-full px-1">{e.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Videos */}
          {selectedEmpresaId && (
            <div className="flex-1 flex flex-col gap-4 min-h-0 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    Paso 2: Gestionar Videos ({filteredVideos.length} disponibles)
                  </label>
                  <p className="text-[10px] text-slate-400 ml-1 mt-0.5 flex items-center gap-1">
                    <Info size={10} /> Haz clic para añadir o remover de la playlist.
                  </p>
                </div>
                <div className="relative w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por nombre..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredVideos.map(v => {
                  const isChecked = tempSelection.includes(String(v.id));
                  const isInactive = v.status === false;

                  return (
                    <button
                      key={v.id}
                      onClick={() => toggleVideo(String(v.id))}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${
                        isChecked
                          ? "bg-slate-900 border-slate-900 ring-2 ring-slate-900/10 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-400"
                      } ${isInactive && !isChecked ? "opacity-60" : ""}`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? "bg-white text-slate-900 border-white"
                          : "border-slate-200 group-hover:border-slate-400"
                      }`}>
                        {isChecked ? <CheckCircle2 size={14} strokeWidth={3} /> : <Film size={12} className="text-slate-300" />}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                            <p className={`text-xs font-bold ${isChecked ? "text-white" : "text-slate-700"}`}>
                              {v.nombre}
                            </p>
                            {isInactive && (
                              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm ${isChecked ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                <AlertTriangle size={8} /> Inactivo
                              </span>
                            )}
                         </div>
                         <p className="text-[10px] text-slate-400">ID: {v.id}</p>
                      </div>
                      {isChecked && (
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded ${isChecked ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800"}`}>
                          En Playlist
                        </span>
                      )}
                    </button>
                  );
                })}

                {filteredVideos.length === 0 && (
                  <div className="py-10 text-center flex flex-col items-center gap-2 opacity-40">
                     <Film size={32} />
                     <p className="text-sm font-medium">No se encontraron videos para esta empresa.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedEmpresaId && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300 py-10 opacity-30">
               <div className="p-6 rounded-full border-4 border-dashed border-slate-200">
                  <PlusCircle size={48} />
               </div>
               <p className="font-bold">Selecciona una empresa arriba para ver sus videos</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
               {tempSelection.length} videos en total para el equipo
            </span>
          </div>
          <div className="flex gap-3">
             <button
               onClick={onClose}
               className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
             >
               Cancelar
             </button>
             <button
               onClick={handleConfirm}
               className="px-8 py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2 transform active:scale-[0.98]"
             >
               Actualizar Playlist
               <ChevronRight size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
