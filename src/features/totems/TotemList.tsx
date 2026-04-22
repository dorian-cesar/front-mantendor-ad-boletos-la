import React from "react";
import { Edit, Trash2, ChevronDown, ChevronUp, Hash, DollarSign, Terminal, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
  onCancelEdit
}: TotemListProps) {
  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-blue-500 mb-2" />
        Cargando equipos...
      </div>
    );
  }

  if (totems.length === 0) {
    return <div className="py-20 text-center text-slate-400 font-medium">No se encontraron tótems registrados.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
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
                  expandedId === t.id ? "bg-blue-50/40 border-blue-100" : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <td className="py-3.5 px-5 text-slate-400 group-hover:text-blue-500 transition-colors">
                  {expandedId === t.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </td>
                <td className="py-3.5 px-5 font-medium text-slate-600 flex items-center gap-2 text-xs">
                  <Hash size={10} className="text-slate-400" />
                  {t.id.toString().substring(0, 8)}
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{t.identificador}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t.direccion}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 font-semibold text-slate-600 text-right pr-6">
                  {t.sales || 0} <span className="text-xs text-slate-400 font-normal ml-0.5">uni.</span>
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
                        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-6 max-w-4xl mx-auto flex flex-col gap-6">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h3 className="font-bold text-blue-600 flex items-center gap-2 text-lg">
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
                                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                              />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Estado Operativo</label>
                                <select 
                                    value={editForm.status}
                                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                                    className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer"
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
                                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all shadow-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 mt-2 border-t border-slate-100 pt-6">
                            <button
                              onClick={onCancelEdit}
                              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => onSave(t.id)}
                              disabled={isSaving}
                              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-transform active:scale-[0.98] shadow-md shadow-blue-200 disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <SaveIcon />}
                              Guardar Cambios
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-16 py-6 flex flex-col md:flex-row gap-10 md:items-start animate-in slide-in-from-top-2 duration-200 fade-in">
                        <div className="flex items-start gap-3 w-1/4">
                          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-blue-500 mt-1">
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
                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-emerald-500 mt-1">
                                <DollarSign size={18} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transacciones</h4>
                                <p className="text-sm text-slate-800 font-medium">Recaudado: ${(t.revenue || 0).toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                        <div className="ml-auto w-1/4 flex flex-col gap-2">
                          <button
                            onClick={() => onEdit(t)}
                            className="text-xs font-semibold px-4 py-2.5 border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                          >
                            <Edit size={14} /> Modificar Tótem
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="text-xs font-semibold px-4 py-2.5 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-2"
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

function SaveIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3"/><path d="M7 3v5h10V3"/></svg>;
}
