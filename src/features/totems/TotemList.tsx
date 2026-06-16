import React, { useState } from "react";
import { Edit, Power, ChevronDown, ChevronUp, Hash, DollarSign, Terminal, Loader2, Film, Video, Building, Save, BarChart3, Ticket } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VideosListDisplay } from "./VideosListDisplay";
import { VideoSelector } from "./VideoSelector";

interface TotemListProps {
  totems: any[];
  loading: boolean;
  expandedId: string | null;
  toggleExpand: (id: string) => void;
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

export function TotemList({
  totems,
  loading,
  expandedId,
  toggleExpand,
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto animate-in fade-in duration-300 transition-colors">
      <table className="w-full min-w-[900px] text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50  border-b border-slate-200  text-slate-600 ">
            <th className="py-3 px-5 font-semibold w-12 text-center"></th>
            <th className="py-3 px-5 font-semibold w-24">ID</th>
            <th className="py-3 px-5 font-semibold">TERMINAL / UBICACIÓN</th>
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
                    ? "bg-slate-50  border-slate-200 " 
                    : "border-slate-100  hover:bg-slate-50 "
                }`}
              >
                <td className="py-3.5 px-5 text-slate-400 group-hover:text-slate-900 transition-colors">
                  {expandedId === t.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </td>
                <td className="py-3.5 px-5 font-bold text-slate-950  flex items-center gap-2 text-xs">
                  <Hash size={10} className="text-slate-900 " />
                  {t.id.toString().substring(0, 8)}
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 ">{t.identificador}</span>
                    <span className="text-[10px] text-slate-400  font-bold uppercase">{t.direccion}</span>
                  </div>
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
                      <div className={`w-2 h-2 rounded-full ${t.is_online ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${t.is_online ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {t.ultimo_login && !t.is_online && (
                      <span className="text-[9px] text-slate-400 font-medium">
                        {new Date(t.ultimo_login).toLocaleDateString()} {new Date(t.ultimo_login).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-5 font-semibold text-slate-600  text-right pr-6 transition-colors">
                  {t.sales || 0} <span className="text-xs text-slate-400  font-normal ml-0.5">uni.</span>
                </td>
                <td className="py-3.5 px-5 font-semibold text-emerald-600 text-right pr-6">
                  ${(t.revenue || 0).toLocaleString("es-CL")}
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-black text-emerald-700">
                    {t.total_transacciones || 0}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-black text-blue-700">
                    {t.boletos_vendidos || 0}
                  </span>
                </td>
                <td className="py-3.5 px-5 flex justify-center items-center gap-2">
                  <StatusBadge status={t.status === true || t.status === "Activo" ? "Activo" : "Inactivo"} />
                  {onStats && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onStats(t); }}
                      className="p-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
                      title="Ver diagnóstico"
                    >
                      <BarChart3 size={14} />
                    </button>
                  )}
                </td>
              </tr>
              {expandedId === t.id && (
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <td colSpan={9} className="p-0">
                    {editingId === t.id ? (
                      <div className="px-4 md:px-16 py-8 animate-in slide-in-from-top-2 duration-200 fade-in">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-6">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                              <Edit size={20} /> Editando Configuración: {t.id}
                            </h3>
                            <StatusBadge status={editForm.status === true || editForm.status === "Activo" ? "Activo" : "Inactivo"} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                              <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
                                Identificador del Equipo
                              </label>
                              <input
                                value={editForm.identificador}
                                onChange={(e) => setEditForm({ ...editForm, identificador: e.target.value })}
                                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                              />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Estado Operativo</label>
                                <select 
                                    value={editForm.status}
                                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                                    className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900/10 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer"
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                            <div className="md:col-span-3">
                              <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
                                Dirección / Ubicación Física
                              </label>
                              <input
                                value={editForm.direccion}
                                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900/10 bg-slate-50 focus:bg-white transition-all shadow-sm"
                              />
                            </div>
                            <div className="md:col-span-3">
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
                                    (window as any).openVideoPicker(t.id, editForm.video_ids);
                                  }}
                                  className="w-full py-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:bg-slate-100/50 hover:border-slate-300 transition-all group"
                                >
                                  <div className="p-3 bg-white rounded-xl shadow-sm text-slate-800 group-hover:scale-110 transition-transform">
                                    <Film size={28} />
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-widest leading-none">Asignar Contenido Multimedia</span>
                                  <span className="text-[10px] text-slate-400 font-medium">Click para abrir el selector rápido por empresa</span>
                                </button>
                          </div>
                          <div className="flex gap-3 mt-6 border-t border-slate-100 pt-6">
                            <button
                              onClick={onCancelEdit}
                              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => onSave(t.id)}
                              disabled={isSaving}
                              className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-slate-900/20 disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                              Guardar Cambios
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 md:px-16 py-6 flex flex-col md:flex-row gap-6 md:gap-10 md:items-start animate-in slide-in-from-top-2 duration-200 fade-in">
                        <div className="flex items-start gap-3 w-full md:w-1/4">
                          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-slate-700 mt-1">
                            <Terminal size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Información Técnica
                            </h4>
                            <p className="text-sm text-slate-800 font-medium">Dir: {t.direccion}</p>
                            <p className="text-xs text-slate-500 mt-0.5">ID: {t.id}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 w-full md:w-1/4">
                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-slate-700 mt-1">
                                <DollarSign size={18} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transacciones</h4>
                                <p className="text-sm text-slate-800 font-medium">Recaudado: ${(t.revenue || 0).toLocaleString('es-CL')}</p>
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
                            className="text-xs font-semibold px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                          >
                            <Edit size={14} /> Modificar Tótem
                          </button>
                          {onToggleStatus && (
                            <button
                              onClick={() => onToggleStatus(t.id, t.status === true || t.status === "Activo")}
                              className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                t.status === true || t.status === "Activo"
                                  ? "text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                                  : "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              <Power size={14} />
                              {t.status === true || t.status === "Activo" ? "Desactivar" : "Activar"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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


