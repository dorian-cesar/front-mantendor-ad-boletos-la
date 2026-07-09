import React, { useState } from "react";
import { Edit, Power, ChevronDown, ChevronUp, Hash, DollarSign, Terminal, Loader2, Film, Video, Building, Save, BarChart3, Ticket, AlertTriangle, Cpu, Database } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VideosListDisplay } from "./VideosListDisplay";
import { VideoSelector } from "./VideoSelector";

interface TotemListProps {
  totems: any[];
  loading: boolean;
  expandedId: string | null;
  toggleExpand: (id: string) => void;
  editingId: string | null;
  loadingEditId?: string | null;
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

export function TotemList({
  totems,
  loading,
  expandedId,
  toggleExpand,
  editingId,
  loadingEditId,
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
}: TotemListProps) {
  
  const handleVideoChange = (selectedIds: string[]) => {
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
      <div className="py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-slate-900 mb-2" />
        Cargando equipos...
      </div>
    );
  }

  if (totems.length === 0) {
    return <div className="py-20 text-center text-slate-400 font-medium">No se encontraron tótems registrados.</div>;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-x-auto animate-in fade-in duration-300 transition-colors">
      <table className="w-full min-w-[900px] text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400">
            <th className="py-3 px-5 font-semibold w-12 text-center"></th>
            <th className="py-3 px-5 font-semibold w-24">ID</th>
            <th className="py-3 px-5 font-semibold">TERMINAL / UBICACIÓN</th>
            <th className="py-3 px-5 font-semibold w-44 text-center">TELEMETRÍA (HW)</th>
            <th className="py-3 px-5 font-semibold w-24 text-center text-[10px] uppercase leading-tight">Bloquear<br/>Protector</th>
            <th className="py-3 px-5 font-semibold w-40 text-center">CONEXIÓN</th>
            <th className="py-3 px-5 font-semibold w-40 text-right pr-6">TICKETS HOY</th>
            <th className="py-3 px-5 font-semibold w-40 text-right pr-6">RECAUDACIÓN</th>
            <th className="py-3 px-5 font-semibold w-28 text-center">TRANSACC.</th>
            <th className="py-3 px-5 font-semibold w-28 text-center">BOLETOS</th>
            <th className="py-3 px-5 font-semibold w-32 text-center">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {totems.map((t) => (
            <React.Fragment key={t.id}>
              <tr
                onClick={() => toggleExpand(t.id)}
                className={`border-b transition-colors cursor-pointer group select-none ${
                  expandedId === t.id 
                    ? "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700" 
                    : "border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                }`}
              >
                <td className="py-3.5 px-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {expandedId === t.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </td>
                <td className="py-3.5 px-5 font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2 text-xs">
                  <Hash size={10} className="text-slate-900 dark:text-slate-300" />
                  {t.id.toString().substring(0, 8)}
                  {t.ultimo_error_critico && (
                    <div title={`Error Crítico: ${t.ultimo_error_critico}`} className="text-red-500 animate-pulse ml-1">
                      <AlertTriangle size={14} />
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t.identificador}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t.direccion}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  {t.ultima_telemetria ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center justify-center gap-2.5 text-[10px] font-bold">
                        <div className="flex items-center gap-1 bg-slate-600 dark:bg-zinc-800 text-white px-1.5 py-0.5 rounded shadow-sm border border-transparent dark:border-zinc-700" title="Uso de CPU">
                          <Cpu size={12} className="text-slate-200 dark:text-slate-400" /> 
                          {t.ultima_telemetria.hardware?.cpu_usage_percent !== undefined ? `${t.ultima_telemetria.hardware.cpu_usage_percent}%` : '--'}
                        </div>
                        <div className="flex items-center gap-1 bg-slate-600 dark:bg-zinc-800 text-white px-1.5 py-0.5 rounded shadow-sm border border-transparent dark:border-zinc-700" title="Uso de RAM">
                          <Database size={12} className="text-slate-200 dark:text-slate-400" />
                          {t.ultima_telemetria.hardware?.ram_total_mb && t.ultima_telemetria.hardware?.ram_available_mb 
                            ? `${Math.round(((t.ultima_telemetria.hardware.ram_total_mb - t.ultima_telemetria.hardware.ram_available_mb) / t.ultima_telemetria.hardware.ram_total_mb) * 100)}%` 
                            : '--'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full gap-1">
                        <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm w-full text-center tracking-wider text-white ${t.ultima_telemetria.perifericos?.printer_connected === false ? 'bg-red-500 border border-red-600' : 'bg-emerald-500 border border-emerald-600'}`}>
                          {t.ultima_telemetria.perifericos?.printer_connected === false ? '⚠️ Impresora Error' : '🖨️ Impresora OK'}
                        </div>
                        {t.ultima_telemetria_ts && (
                          <div 
                            key={t.ultima_telemetria_ts} 
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" 
                            title={`Actualizado: ${new Date(t.ultima_telemetria_ts).toLocaleTimeString()}`}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 font-medium text-center italic px-3 py-1 bg-slate-50 rounded-full border border-slate-100">Sin datos</div>
                  )}
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex justify-center items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBlockScreenSaver(t.id, t.block_screen_saver || false);
                      }}
                      className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 shadow-inner ${t.block_screen_saver ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      title="Mantener pantalla activa"
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${t.block_screen_saver ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      {(() => {
                        let isSleeping = false;
                        try {
                          const telem = typeof t.ultima_telemetria === 'string' ? JSON.parse(t.ultima_telemetria) : t.ultima_telemetria;
                          if (telem?.servicios_locales?.kiosk_app_responding === false) isSleeping = true;
                        } catch {}

                        if (!t.is_online) {
                          return (
                            <>
                              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                              <span className="text-[10px] font-black uppercase tracking-tighter text-red-500">Offline</span>
                            </>
                          );
                        }
                        if (isSleeping) {
                          return (
                            <>
                              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                              <span className="text-[10px] font-black uppercase tracking-tighter text-amber-500">Reposo</span>
                            </>
                          );
                        }
                        return (
                          <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600">Online</span>
                          </>
                        );
                      })()}
                    </div>
                    {t.ultimo_login && !t.is_online && (
                      <span className="text-[9px] text-slate-400 font-medium">
                        {new Date(t.ultimo_login).toLocaleDateString()} {new Date(t.ultimo_login).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-5 font-semibold text-slate-600 dark:text-slate-300 text-right pr-6 transition-colors">
                  {t.sales || 0} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-0.5">uni.</span>
                </td>
                <td className="py-3.5 px-5 font-semibold text-emerald-600 text-right pr-6">
                  ${(t.revenue || 0).toLocaleString("es-CL")}
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 border border-emerald-600 rounded-lg text-xs font-black text-white shadow-sm">
                    {t.total_transacciones || 0}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 border border-blue-600 rounded-lg text-xs font-black text-white shadow-sm">
                    {t.boletos_vendidos || 0}
                  </span>
                </td>
                <td className="py-3.5 px-5 flex justify-center items-center gap-2">
                  <StatusBadge status={t.status === true || t.status === "Activo" ? "Activo" : "Inactivo"} />
                  {onStats && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onStats(t); }}
                      className="p-1.5 bg-emerald-600 border border-emerald-700 hover:bg-emerald-700 rounded-lg transition-colors text-white"
                      title="Ver diagnóstico"
                    >
                      <BarChart3 size={14} />
                    </button>
                  )}
                </td>
              </tr>
              {expandedId === t.id && (
                <tr className="bg-slate-50/50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800">
                  <td colSpan={10} className="p-0">
                      <div className="px-6 md:px-16 py-6 flex flex-col md:flex-row gap-6 md:gap-10 md:items-start animate-in slide-in-from-top-2 duration-200 fade-in">
                        <div className="flex items-start gap-3 w-full md:w-1/4">
                          <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm text-slate-700 dark:text-slate-300 mt-1">
                            <Terminal size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                              Información Técnica
                            </h4>
                            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">Dir: {t.direccion}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ID: {t.id}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 w-full md:w-1/4">
                            <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm text-slate-700 dark:text-slate-300 mt-1">
                                <DollarSign size={18} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Transacciones</h4>
                                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">Recaudado: ${(t.revenue || 0).toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                        {/* Videos assigned section */}
                        <div className="flex-1 flex flex-col gap-3 w-full md:min-w-[300px]">
                            <VideosListDisplay 
                              videos={allVideos} 
                              empresas={empresas} 
                              videoIds={t.playlist && t.playlist.length > 0 ? t.playlist.map((p: any) => p.id || p.video_id) : (t.video_ids && t.video_ids.length > 0 ? t.video_ids : (t.videos?.map((v: any) => v.id) || []))} 
                            />
                        </div>
                        <div className="w-full md:w-1/4 flex flex-row md:flex-col gap-2">
                          <button
                            onClick={() => onEdit(t)}
                            disabled={loadingEditId === t.id}
                            className={`text-xs font-semibold px-4 py-2.5 border border-transparent rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${
                              loadingEditId === t.id 
                                ? "bg-slate-300 dark:bg-zinc-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                                : "bg-slate-800 dark:bg-zinc-800 hover:bg-slate-700 dark:hover:bg-zinc-700 text-white"
                            }`}
                          >
                            {loadingEditId === t.id ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Cargando...
                              </>
                            ) : (
                              <>
                                <Edit size={14} /> Modificar Tótem
                              </>
                            )}
                          </button>
                          {onToggleStatus && (
                            <button
                              onClick={() => onToggleStatus(t.id, t.status === true || t.status === "Activo")}
                              className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                t.status === true || t.status === "Activo"
                                  ? "text-white bg-amber-600 border border-amber-700 hover:bg-amber-700"
                                  : "text-white bg-emerald-600 border border-emerald-700 hover:bg-emerald-700"
                              }`}
                            >
                              <Power size={14} />
                              {t.status === true || t.status === "Activo" ? "Desactivar" : "Activar"}
                            </button>
                          )}
                        </div>
                      </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}


