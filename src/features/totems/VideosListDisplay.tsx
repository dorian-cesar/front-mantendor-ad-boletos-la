import React from "react";
import { Film, Hash, Video, PlayCircle, Building, ChevronRight, AlertTriangle } from "lucide-react";

interface VideosListDisplayProps {
  videos: any[];
  empresas: any[];
  videoIds?: string[];
}

export function VideosListDisplay({ videos, empresas, videoIds = [] }: VideosListDisplayProps) {
  // Debug log to trace data flow
  // console.log("VideosListDisplay props:", { videoIds, videosCount: videos.length });
  const selectedVideos = videos.filter(v => videoIds.some(vid => String(vid) === String(v.id)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <PlayCircle size={12} className="text-slate-900" />
          Lista de Reproducción
        </label>
        <div className="flex items-center gap-2">
           {selectedVideos.some(v => v.status === false) && (
             <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest border border-slate-900 animate-pulse">
               <AlertTriangle size={8} /> Contenido Deshabilitado
             </span>
           )}
           <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
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
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {selectedVideos.map((v) => {
            const empresa = empresas.find(e => String(e.id) === String(v.empresa_id));
            const isInactive = v.status === false;
            
            return (
              <div 
                key={v.id}
                className={`flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-900 transition-all group ${isInactive ? "opacity-75 grayscale-[0.5]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isInactive ? "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"}`}>
                    <Video size={14} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-bold ${isInactive ? "text-slate-500" : "text-slate-800"}`}>
                        {v.nombre}
                       </span>
                       {isInactive && (
                         <span className="text-[8px] font-black bg-slate-200 text-slate-800 px-1 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                            No Disponible
                         </span>
                       )}
                    </div>
                    {empresa && (
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {empresa.nombre}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${isInactive ? "bg-slate-200" : "bg-slate-900 shadow-[0_0_8px_rgba(0,0,0,0.1)]"}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

