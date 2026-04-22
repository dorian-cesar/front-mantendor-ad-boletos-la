import React from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface TotemModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: { identificador: string; direccion: string };
  setForm: (form: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function TotemModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
  isSaving,
}: TotemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Nuevo Terminal</h3>
              <p className="text-blue-100 text-xs font-medium">Registrar equipo en la red</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Identificador del Tótem
            </label>
            <input
              type="text"
              placeholder="Ej: Terminal Alameda - Totem 5"
              value={form.identificador}
              onChange={(e) => setForm({ ...form, identificador: e.target.value })}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Dirección / Ubicación Física
            </label>
            <input
              type="text"
              placeholder="Ej: Av. Libertador 1234, Local 45"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm outline-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !form.identificador || !form.direccion}
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <>Registrar Equipo</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
