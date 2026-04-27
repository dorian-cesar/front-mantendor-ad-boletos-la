import React, { useState } from "react";
import { Edit, Trash2, ChevronDown, ChevronUp, Hash, DollarSign, Terminal, Loader2, Film, Video, Building, Save } from "lucide-react";
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
  isSaving: boolean;
  onCancelEdit: () => void;
  allVideos: any[];
  availableVideos: any[];
  empresas: any[];
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
  isSaving,
  onCancelEdit,
  allVideos,
  availableVideos,
  empresas,
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
    <div className="bg-white  rounded-xl shadow-sm border border-slate-200  overflow-hidden animate-in fade-in duration-300 transition-colors">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50  border-b border-slate-200  text-slate-600 ">
            <th className="py-3 px-5 font-semibold w-12 text-center"></th>
            <th className="py-3 px-5 font-semibold w-24">ID</th>
            <th className="py-3 px-5 font-semibold">TERMINAL / UBICACIÓN</th>
            <th className="py-3 px-5 font-semibold w-40 text-right pr-6">TICKETS HOY</th>
            <th className="py-3 px-5 font-semibold w-40 text-right pr-6">RECAUDACIÓN</th>
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
                <td className="py-3.5 px-5 font-semibold text-slate-600  text-right pr-6 transition-colors">
                  {t.sales || 0} <span className="text-xs text-slate-400  font-normal ml-0.5">uni.</span>
                </td>
                <td className="py-3.5 px-5 font-semibold text-emerald-600 text-right pr-6">
                  ${(t.revenue || 0).toLocaleString("es-CL")}
                </td>
                <td className="py-3.5 px-5 flex justify-center">
                  <StatusBadge status={t.status || "Activo"} />
                </td>
              </tr>
              {expandedId === t.id && (
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <td colSpan={6} className="p-0">
                    {editingId === t.id ? (
                      <div className="px-16 py-8 animate-in slide-in-from-top-2 duration-200 fade-in">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 max-w-4xl mx-auto flex flex-col gap-6">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                              <Edit size={20} /> Editando Configuración: {t.id}
                            </h3>
                            <StatusBadge status={editForm.status} />
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
                      <div className="px-16 py-6 flex flex-col md:flex-row gap-10 md:items-start animate-in slide-in-from-top-2 duration-200 fade-in">
                        <div className="flex items-start gap-3 w-1/4">
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
                        <div className="flex items-start gap-3 w-1/4">
                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-slate-700 mt-1">
                                <DollarSign size={18} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transacciones</h4>
                                <p className="text-sm text-slate-800 font-medium">Recaudado: ${(t.revenue || 0).toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                        {/* Videos assigned section */}
                        <div className="flex-1 flex flex-col gap-3 min-w-[300px]">
                            <VideosListDisplay 
                              videos={allVideos} 
                              empresas={empresas} 
                              videoIds={t.video_ids || t.videos?.map((v: any) => v.id) || []} 
                            />
                        </div>
                        <div className="ml-auto w-1/4 flex flex-col gap-2">
                          <button
                            onClick={() => onEdit(t)}
                            className="text-xs font-semibold px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                          >
                            <Edit size={14} /> Modificar Tótem
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="text-xs font-semibold px-4 py-2.5 text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
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


