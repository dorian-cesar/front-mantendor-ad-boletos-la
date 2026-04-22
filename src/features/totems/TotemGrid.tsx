import React from "react";
import { Edit, Trash2, MonitorSmartphone, Terminal, Loader2, Save } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface TotemGridProps {
  totems: any[];
  loading: boolean;
  editingId: string | null;
  editForm: any;
  setEditForm: (form: any) => void;
  onEdit: (totem: any) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  onCancelEdit: () => void;
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
  isSaving,
  onCancelEdit,
}: TotemGridProps) {
  if (loading) {
    return (
      <div className="col-span-full py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-blue-500 mb-2" />
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
                ? "border-blue-400 ring-4 ring-blue-50 scale-[1.02] shadow-lg relative z-10"
                : "border-slate-200 hover:shadow-md"
            } shadow-sm transition-all flex flex-col overflow-hidden group`}
          >
            {isEditing ? (
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-1 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-blue-600 flex items-center gap-2">
                    <Edit size={16} /> Editando Equipo
                  </h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Identificador</label>
                  <input
                    value={editForm.identificador}
                    onChange={(e) => setEditForm({ ...editForm, identificador: e.target.value })}
                    className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Dirección / Ubicación</label>
                  <input
                    value={editForm.direccion}
                    onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                    className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

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
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[200px]">
                <button
                  onClick={() => onEdit(t)}
                  className="w-2/5 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 group/icon transition-all duration-300 relative overflow-hidden"
                  title="Haga clic para modificar el tótem"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/0 to-blue-400/0 group-hover/icon:from-blue-400/5 group-hover/icon:to-transparent transition-all duration-500" />
                  <div className="p-5 rounded-3xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover/icon:text-blue-600 group-hover/icon:scale-110 group-hover/icon:shadow-md transition-all duration-500 z-10">
                    <MonitorSmartphone size={44} strokeWidth={1.5} />
                  </div>
                </button>
                <div className="flex-1 p-5 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <StatusBadge status={t.status || "Activo"} />
                      <span className="text-[10px] font-bold text-slate-300 tracking-widest whitespace-nowrap ml-2">
                        ID: {t.id.toString().substring(0, 6)}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-[16px] leading-tight mb-4 group-hover:text-blue-700 transition-colors line-clamp-2">
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDelete(t.id)}
                        className="flex-1 py-2 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
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
