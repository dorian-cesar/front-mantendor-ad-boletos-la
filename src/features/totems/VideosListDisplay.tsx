import { Film, Hash, Video, PlayCircle, Building, ChevronRight, AlertTriangle, ChevronUp, ChevronDown, X } from "lucide-react";

interface VideosListDisplayProps {
  videos: any[];
  empresas: any[];
  videoIds?: string[];
  onReorder?: (newOrder: string[]) => void;
  onRemove?: (videoId: string) => void;
}

export function VideosListDisplay({ videos, empresas, videoIds = [], onReorder, onRemove }: VideosListDisplayProps) {
  // Respect the order of videoIds array
  const selectedVideos = videoIds
    .map(vid => videos.find(v => String(v.id) === String(vid)))
    .filter((v): v is any => v !== undefined);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!onReorder) return;
    const newOrder = [...videoIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    
    onReorder(newOrder);
  };

  const removeItem = (videoId: string) => {
    if (!onRemove) return;
    onRemove(videoId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
          <PlayCircle size={12} className="text-slate-900" />
          Lista de Reproducción
        </label>
        <div className="flex items-center gap-2">
           {selectedVideos.some(v => v.status === false) && (
             <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-widest border border-red-700 animate-pulse shadow-lg shadow-red-200">
               <AlertTriangle size={10} /> Videos Inactivos (No se reproducirán)
             </span>
           )}
           <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full transition-colors">
            {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {selectedVideos.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <Film size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-400 font-medium text-balance">
                No hay videos asignados actualmente.
            </p>
        </div>
      ) : (
        <div className="space-y-2 h-[192px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {selectedVideos.map((v, index) => {
            const empresa = empresas.find(e => String(e.id) === String(v.empresa_id));
            const isInactive = v.status === false || v.status === 0 || v.status === "Inactivo";
            
            return (
              <div 
                key={`${v.id}-${index}`}
                className={`flex items-center justify-between p-3 bg-white border transition-all group ${isInactive ? "border-red-100 bg-red-50/30 opacity-90" : "border-slate-100 rounded-xl hover:border-slate-900"}`}
                style={isInactive ? { borderRadius: '12px' } : {}}
              >
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-black text-slate-300 w-4">{index + 1}</div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isInactive ? "bg-red-100 text-red-500 shadow-inner" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"}`}>
                    <Video size={14} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-bold transition-colors ${isInactive ? "text-red-900" : "text-slate-800"}`}>
                        {v.nombre}
                       </span>
                       {isInactive && (
                         <div className="flex items-center gap-1.5">
                           <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                              ERROR
                           </span>
                           <span className="text-[9px] font-bold text-red-500 italic">
                              No se reproducirá (Inactivo)
                           </span>
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {empresa && (
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${isInactive ? "text-red-300" : "text-slate-400"}`}>
                          {empresa.nombre}
                        </span>
                      )}
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${isInactive ? "text-red-300" : "text-slate-400"}`}>
                        • {v.resolucion || v.resolution || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {onReorder && (
                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1.5 hover:text-slate-900 disabled:text-slate-200 transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <div className="w-px h-3 bg-slate-200" />
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                        disabled={index === selectedVideos.length - 1}
                        className="p-1.5 hover:text-slate-900 disabled:text-slate-200 transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}
                  {onRemove && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeItem(String(v.id)); }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                      title="Quitar video del tótem"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${isInactive ? "bg-slate-200" : "bg-slate-900 shadow-[0_0_8px_rgba(0,0,0,0.1)]"}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
