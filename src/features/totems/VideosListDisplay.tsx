import React, { useState } from "react";
import { Film, Hash, Video, PlayCircle, Building, ChevronRight, AlertTriangle, ChevronUp, ChevronDown, X, GripVertical, Eye, Calendar, HardDrive, Monitor, FileType, Clock } from "lucide-react";

interface VideosListDisplayProps {
  videos: any[];
  empresas: any[];
  videoIds?: string[];
  onReorder?: (newOrder: string[]) => void;
  onRemove?: (videoId: string) => void;
}

export function VideosListDisplay({ videos, empresas, videoIds = [], onReorder, onRemove }: VideosListDisplayProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [viewingVideo, setViewingVideo] = useState<any | null>(null);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (!onReorder || draggedIndex === null || draggedIndex === targetIndex) return;

    const newOrder = [...videoIds];
    const [moved] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    
    onReorder(newOrder);
    setDraggedIndex(null);
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
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {selectedVideos.map((v, index) => {
            const empresa = empresas.find(e => String(e.id) === String(v.empresa_id));
            const isInactive = v.status === false || v.status === 0 || v.status === "Inactivo";
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            
            return (
              <div 
                key={`${v.id}-${index}`}
                draggable={!!onReorder}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center justify-between p-3 bg-white border transition-all group ${
                  !!onReorder ? "cursor-grab active:cursor-grabbing" : ""
                } ${
                  isInactive ? "border-red-100 bg-red-50/30 opacity-90" : "border-slate-100 rounded-xl hover:border-slate-900"
                } ${isDragging ? "opacity-50 scale-[0.98]" : ""} ${
                  isDragOver ? "border-t-4 border-t-blue-500" : ""
                }`}
                style={isInactive ? { borderRadius: '12px' } : {}}
              >
                <div className="flex items-center gap-3">
                  {!!onReorder && <GripVertical size={16} className="text-slate-300 cursor-grab" />}
                  
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-[11px] shadow-sm shrink-0">
                    {index + 1}
                  </div>

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
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViewingVideo(v); }}
                    className="p-2 shrink-0 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-200 opacity-100 md:opacity-0 group-hover:opacity-100"
                    title="Ver detalles del video"
                  >
                    <Eye size={16} strokeWidth={2.5} />
                  </button>
                  {onReorder && (
                    <div className="flex flex-col gap-1 mr-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1 rounded transition-colors hover:bg-slate-100 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} strokeWidth={3} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                        disabled={index === selectedVideos.length - 1}
                        className="p-1 rounded transition-colors hover:bg-slate-100 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                  {onRemove && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeItem(String(v.id)); }}
                      className="p-2 shrink-0 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-200 opacity-100 md:opacity-0 group-hover:opacity-100"
                      title="Quitar video del tótem"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalles del Video */}
      {viewingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setViewingVideo(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <Film size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-tight">Detalles del Video</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {viewingVideo.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingVideo(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nombre del Archivo</span>
                <p className="text-sm font-bold text-slate-800 break-words">{viewingVideo.nombre || viewingVideo.original_name || 'Desconocido'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <Monitor size={12} /> Resolución
                  </span>
                  <p className="text-xs font-bold text-slate-900">{viewingVideo.resolucion || viewingVideo.resolution || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <HardDrive size={12} /> Tamaño
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {viewingVideo.peso
                      ? (viewingVideo.peso / (1024 * 1024)).toFixed(2) + " MB"
                      : viewingVideo.tamano
                      ? typeof viewingVideo.tamano === "number"
                        ? (viewingVideo.tamano / (1024 * 1024)).toFixed(2) + " MB"
                        : viewingVideo.tamano
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <FileType size={12} /> Formato
                  </span>
                  <p className="text-xs font-bold text-slate-900 uppercase">
                    {viewingVideo.extension || viewingVideo.format || viewingVideo.mimetype || 'MP4'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <Clock size={12} /> Duración
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {viewingVideo.duracion || viewingVideo.duration 
                      ? (() => {
                          const secs = Number(viewingVideo.duracion || viewingVideo.duration);
                          if (secs < 60) return `${secs}s`;
                          const m = Math.floor(secs / 60);
                          const s = Math.floor(secs % 60);
                          return `${m}m ${s}s`;
                        })()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Calendar size={12} /> Fecha de Subida
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {viewingVideo.createdAt || viewingVideo.created_at 
                    ? new Date(viewingVideo.createdAt || viewingVideo.created_at).toLocaleString('es-CL') 
                    : 'Desconocida'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
