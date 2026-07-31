import React, { useState } from "react";
import { Edit, Power, MonitorSmartphone, Terminal, Loader2, Save, Film, Building, BarChart3, Ticket, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VideosListDisplay } from "./VideosListDisplay";
import { VideoSelector } from "./VideoSelector";

interface TotemGridProps {
  totems: any[];
  loading: boolean;
  editingId: string | null;
  loadingEditId?: string | null;
  editForm: any;
  setEditForm: (form: any) => void;
  onEdit: (totem: any) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleBlockScreenSaver: (id: string, currentValue: boolean) => void;
  onToggleModoPrueba?: (id: string, currentValue: boolean) => void;
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
  loadingEditId,
  editForm,
  setEditForm,
  onEdit,
  onSave,
  onDelete,
  onToggleBlockScreenSaver,
  onToggleModoPrueba,
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
            className={`bg-white dark:bg-zinc-900 rounded-2xl border ${
              isEditing
                ? "border-slate-900 dark:border-slate-100 ring-4 ring-slate-900/10 dark:ring-white/10 scale-[1.02] shadow-xl relative z-10"
                : "border-slate-200 dark:border-zinc-800/60 hover:shadow-md"
            } shadow-sm transition-all flex flex-col overflow-hidden group`}
          >
            <div className="flex h-full min-h-[200px]">
                  <button
                    onClick={() => onEdit(t)}
                    disabled={loadingEditId === t.id}
                    className={`w-2/5 border-r border-slate-100 dark:border-zinc-800/60 flex flex-col items-center justify-center gap-3 group/icon transition-all duration-300 relative overflow-hidden ${
                      loadingEditId === t.id
                        ? "bg-slate-200/50 dark:bg-zinc-800/50 cursor-not-allowed"
                        : "bg-slate-50 dark:bg-zinc-800/30 hover:bg-slate-100 dark:hover:bg-zinc-800/70"
                    }`}
                    title={loadingEditId === t.id ? "Cargando..." : "Haga clic para modificar el tótem"}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover/icon:from-slate-400/5 dark:group-hover/icon:from-white/5 group-hover/icon:to-transparent transition-all duration-500" />
                    <div className="p-5 rounded-3xl bg-white dark:bg-zinc-800 shadow-sm border border-slate-100 dark:border-zinc-700 text-slate-400 dark:text-slate-500 group-hover/icon:text-slate-900 dark:group-hover/icon:text-white group-hover/icon:scale-110 group-hover/icon:shadow-md transition-all duration-500 z-10 flex flex-col items-center gap-2">
                      {loadingEditId === t.id ? (
                        <Loader2 size={44} strokeWidth={1.5} className="animate-spin text-slate-400" />
                      ) : (
                        <MonitorSmartphone size={44} strokeWidth={1.5} />
                      )}
                    </div>
                  </button>
                  <div className="flex-1 p-5 flex flex-col justify-between bg-white dark:bg-zinc-900">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={t.status === true || t.status === "Activo" ? "Activo" : "Inactivo"} />
                          {t.ultimo_error_critico && (
                            <div title={`Error Crítico: ${t.ultimo_error_critico}`} className="text-red-500 bg-red-50 p-1 rounded-md border border-red-200 animate-pulse flex-shrink-0">
                              <AlertTriangle size={14} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 ml-1">
                          {(() => {
                            let isSleeping = false;
                            try {
                              const telem = typeof t.ultima_telemetria === 'string' ? JSON.parse(t.ultima_telemetria) : t.ultima_telemetria;
                              if (telem?.servicios_locales?.kiosk_app_responding === false) isSleeping = true;
                            } catch {}

                            if (!t.is_online) {
                              return (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-red-400" />
                                  <span className="text-[9px] font-black uppercase tracking-tighter text-red-500">Offline</span>
                                </>
                              );
                            }
                            if (isSleeping) {
                              return (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                                  <span className="text-[9px] font-black uppercase tracking-tighter text-amber-500">Reposo</span>
                                </>
                              );
                            }
                            return (
                              <>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600">Online</span>
                              </>
                            );
                          })()}
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
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[16px] leading-tight mb-4 group-hover:text-slate-900 dark:group-hover:text-white transition-colors line-clamp-2">
                      {t.identificador}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-50 dark:border-zinc-800/50 pb-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5 tracking-wider uppercase">
                          Recaudado
                        </span>
                        <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                          ${(t.revenue || 0).toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    {/* Transacciones y Boletos */}
                    {(t.total_transacciones > 0 || t.boletos_vendidos > 0) && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-500 rounded-lg p-2 text-center shadow-sm">
                          <p className="text-sm font-black text-white">{t.total_transacciones || 0}</p>
                          <p className="text-[8px] font-bold text-emerald-100 uppercase tracking-wider">Transacciones</p>
                        </div>
                        <div className="bg-blue-500 rounded-lg p-2 text-center shadow-sm">
                          <p className="text-sm font-black text-white">{t.boletos_vendidos || 0}</p>
                          <p className="text-[8px] font-bold text-blue-100 uppercase tracking-wider">Boletos</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Terminal size={10} /> Ubicación
                        </span>
                        <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-700 max-w-[100px] truncate">
                          {t.direccion}
                        </span>
                      </div>
                    </div>
                    {/* Video count badge */}
                    {(t.video_ids?.length > 0 || t.videos?.length > 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Film size={10} /> Videos
                        </span>
                        <span className="text-[10px] text-white font-bold bg-slate-800 dark:bg-slate-700 px-2 py-0.5 rounded border border-transparent shadow-sm">
                          {t.video_ids?.length || t.videos?.length || 0} asignado{(t.video_ids?.length || t.videos?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {/* Empresa count badge */}
                    {(t.empresa_ids?.length > 0 || t.empresas?.length > 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Building size={10} /> Empresas
                        </span>
                        <span className="text-[10px] text-white font-bold bg-slate-800 dark:bg-slate-700 px-2 py-0.5 rounded border border-transparent shadow-sm">
                          {t.empresa_ids?.length || t.empresas?.length || 0} asignada{(t.empresa_ids?.length || t.empresas?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 flex flex-col">
                        <span>Bloquear Protector</span>
                        <span className="text-[8px] font-normal text-slate-400 dark:text-slate-500">Mantener pantalla activa</span>
                      </span>
                      <button
                        onClick={() => onToggleBlockScreenSaver(t.id, t.block_screen_saver || false)}
                        className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${t.block_screen_saver ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-700'}`}
                        title="Alternar protector de pantalla"
                      >
                        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-300 ${t.block_screen_saver ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 flex flex-col">
                        <span>Modo Prueba</span>
                        <span className="text-[8px] font-normal text-slate-400 dark:text-slate-500">Activar modo de prueba</span>
                      </span>
                      <button
                        onClick={() => {
                          if (onToggleModoPrueba) {
                            onToggleModoPrueba(t.id, t.modo_prueba || false)
                          }
                        }}
                        className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${t.modo_prueba ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-zinc-700'}`}
                        title="Alternar modo de prueba"
                      >
                        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-300 ${t.modo_prueba ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
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
                          className="flex-1 py-2 text-[11px] font-bold text-white bg-emerald-600 border border-emerald-700 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <BarChart3 size={12} /> Diagnóstico
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(t.id, t.status === true || t.status === "Activo")}
                          className={`flex-1 py-2 text-[11px] font-bold text-white rounded-lg transition-colors flex items-center justify-center gap-2 border ${
                            t.status === true || t.status === "Activo"
                              ? "bg-amber-600 border-amber-700 hover:bg-amber-700"
                              : "bg-emerald-600 border-emerald-700 hover:bg-emerald-700"
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
          </div>
        );
      })}
    </div>
  );
}
