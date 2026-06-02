import React, { useState } from "react";
import { Edit, Power, MonitorSmartphone, Terminal, Loader2, Save, Film, Building, BarChart3, Ticket } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VideosListDisplay } from "./VideosListDisplay";
import { VideoSelector } from "./VideoSelector";

interface TotemGridProps {
  totems: any[];
  loading: boolean;
  editingId: string | null;
  editForm: any;
  setEditForm: (form: any) => void;
  onEdit: (totem: any) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleBlockScreenSaver: (id: string, currentValue: boolean) => void;
  isSaving: boolean;
  onCancelEdit: () => void;
  allVideos: any[];
  availableVideos: any[];
  empresas: any[];
  onStats?: (totem: any) => void;
  onToggleStatus?: (id: string, currentStatus: boolean) => void;
}

export function TotemGrid({
  totems,
  loading,
  editingId,
  editForm,
  setEditForm,
  onEdit,
  onSave,
  onDelete,
  onToggleBlockScreenSaver,
  isSaving,
  onCancelEdit,
  allVideos,
  availableVideos,
  empresas,
  onStats,
  onToggleStatus,
}: TotemGridProps) {

  const handleVideoChange = (selectedIds: string[]) => {
    // Calcular automáticamente qué empresas están involucradas en estos videos
    const selectedVideos = allVideos.filter(v => selectedIds.includes(String(v.id)));
    const uniqueEmpresaIds = Array.from(new Set(selectedVideos.map(v => v.empresa_id)));
    
    setEditForm({
      ...editForm,
      video_ids: selectedIds,
      empresa_ids: uniqueEmpresaIds
    });
  };

  if (loading) {
    return (
      <div className="col-span-full py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-slate-900 mb-2" />
        Cargando equipos...
      </div>
    );
  }

  if (totems.length === 0) {
    return <div className="col-span-full py-20 text-center text-slate-400 font-medium">No se encontraron tótems registrados.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {totems.map((t) => {
        const isEditing = editingId === t.id;

        return (
          <div
            key={t.id}
            className={`bg-white rounded-2xl border ${
              isEditing
                ? "border-slate-900 ring-4 ring-slate-900/10 scale-[1.02] shadow-xl relative z-10"
                : "border-slate-200 hover:shadow-md"
            } shadow-sm transition-all flex flex-col overflow-hidden group`}
          >
            {isEditing ? (
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-1 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Edit size={16} /> Editando Equipo
                  </h3>
                  <StatusBadge status={editForm.status === true || editForm.status === "Activo" ? "Activo" : "Inactivo"} />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Identificador</label>
                  <input
                    value={editForm.identificador}
                    onChange={(e) => setEditForm({ ...editForm, identificador: e.target.value })}
                    className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900/40 outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Dirección / Ubicación</label>
                  <input
                    value={editForm.direccion}
                    onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                    className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/40 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

                  <div className="py-2">
                    <VideosListDisplay
                      videos={allVideos}
                      empresas={empresas}
                      videoIds={editForm.video_ids || []}
                      onReorder={(newOrder) => setEditForm((prev: any) => ({ ...prev, video_ids: newOrder }))}
                      onRemove={(videoId) => {
                        const newIds = (editForm.video_ids || []).filter((id: string) => String(id) !== String(videoId));
                        const remainingVideos = allVideos.filter(v => newIds.includes(String(v.id)));
                        const newEmpresaIds = Array.from(new Set(remainingVideos.map(v => String(v.empresa_id))));
                        setEditForm((prev: any) => ({ ...prev, video_ids: newIds, empresa_ids: newEmpresaIds }));
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      // Este botón abrirá el modal simplificado que pidió el usuario
                      (window as any).openVideoPicker(t.id, editForm.video_ids);
                    }}
                    className="w-full py-5 mt-2 bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-800 hover:bg-slate-200 transition-all group"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm text-slate-900 group-hover:scale-110 transition-transform">
                       <Film size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest leading-none">Asignar Contenido Multimedia</span>
                    <span className="text-[10px] text-slate-400 font-medium">Click para abrir el selector rápido por empresa</span>
                  </button>

                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                  <button
                    onClick={onCancelEdit}
                    className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => onSave(t.id)}
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar Cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[200px]">
                <button
                  onClick={() => onEdit(t)}
                  className="w-2/5 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center gap-3 hover:bg-slate-100 group/icon transition-all duration-300 relative overflow-hidden"
                  title="Haga clic para modificar el tótem"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover/icon:from-slate-400/5 group-hover/icon:to-transparent transition-all duration-500" />
                  <div className="p-5 rounded-3xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover/icon:text-slate-900 group-hover/icon:scale-110 group-hover/icon:shadow-md transition-all duration-500 z-10">
                    <MonitorSmartphone size={44} strokeWidth={1.5} />
                  </div>
                </button>
                <div className="flex-1 p-5 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={!t.is_online ? "Desconectado" : (t.status === true || t.status === "Activo" ? "Activo" : "Inactivo")} />
                        <div className="flex items-center gap-1.5 ml-1">
                          <div className={`w-2 h-2 rounded-full ${t.is_online ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-400'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${t.is_online ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-900 tracking-widest whitespace-nowrap">
                          ID: {t.id.toString().substring(0, 6)}
                        </span>
                        {t.ultimo_login && !t.is_online && (
                          <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">
                            Visto: {new Date(t.ultimo_login).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-[16px] leading-tight mb-4 group-hover:text-slate-900 transition-colors line-clamp-2">
                      {t.identificador}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-50 pb-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block mb-0.5 tracking-wider uppercase">
                          Recaudado
                        </span>
                        <span className="text-xl font-black text-slate-800 tracking-tight">
                          ${(t.revenue || 0).toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    {/* Transacciones y Boletos */}
                    {(t.total_transacciones > 0 || t.boletos_vendidos > 0) && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center">
                          <p className="text-sm font-black text-emerald-700">{t.total_transacciones || 0}</p>
                          <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Transacciones</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-center">
                          <p className="text-sm font-black text-blue-700">{t.boletos_vendidos || 0}</p>
                          <p className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Boletos</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Terminal size={10} /> Ubicación
                        </span>
                        <span className="text-[10px] text-slate-700 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-[100px] truncate">
                          {t.direccion}
                        </span>
                      </div>
                    </div>
                    {/* Video count badge */}
                    {(t.video_ids?.length > 0 || t.videos?.length > 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Film size={10} /> Videos
                        </span>
                        <span className="text-[10px] text-white font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-900">
                          {t.video_ids?.length || t.videos?.length || 0} asignado{(t.video_ids?.length || t.videos?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {/* Empresa count badge */}
                    {(t.empresa_ids?.length > 0 || t.empresas?.length > 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Building size={10} /> Empresas
                        </span>
                        <span className="text-[10px] text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {t.empresa_ids?.length || t.empresas?.length || 0} asignada{(t.empresa_ids?.length || t.empresas?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2 border-t border-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 flex flex-col">
                        <span>Bloquear Protector</span>
                        <span className="text-[8px] font-normal text-slate-400">Mantener pantalla activa</span>
                      </span>
                      <button
                        onClick={() => onToggleBlockScreenSaver(t.id, t.block_screen_saver || false)}
                        className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${t.block_screen_saver ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        title="Alternar protector de pantalla"
                      >
                        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-300 ${t.block_screen_saver ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-50">
                       <VideosListDisplay 
                         videos={allVideos} 
                         empresas={empresas} 
                         videoIds={t.playlist && t.playlist.length > 0 ? t.playlist.map((p: any) => p.id || p.video_id) : (t.video_ids && t.video_ids.length > 0 ? t.video_ids : (t.videos?.map((v: any) => v.id) || []))} 
                       />
                    </div>

                    <div className="flex gap-2">
                      {onStats && (
                        <button
                          onClick={() => onStats(t)}
                          className="flex-1 py-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <BarChart3 size={12} /> Diagnóstico
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(t.id, t.status === true || t.status === "Activo")}
                          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            t.status === true || t.status === "Activo"
                              ? "text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                              : "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          <Power size={12} />
                          {t.status === true || t.status === "Activo" ? "Desactivar" : "Activar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
