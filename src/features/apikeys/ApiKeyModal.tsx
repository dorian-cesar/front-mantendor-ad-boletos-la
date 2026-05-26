"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Shield, TabletSmartphone, CheckCircle2, AlertCircle } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => Promise<boolean>;
  totems: any[];
  isSaving: boolean;
  initialData?: any;
}

export function ApiKeyModal({ isOpen, onClose, onSubmit, totems, isSaving, initialData }: ApiKeyModalProps) {
  const [form, setForm] = useState({
    description: "",
    tipo: "PLATAFORMA" as "PLATAFORMA" | "TOTEM",
    totem_id: "" as string | number,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          description: initialData.description || "",
          tipo: initialData.tipo || "PLATAFORMA",
          totem_id: initialData.totem_id || "",
        });
      } else {
        setForm({
          description: "",
          tipo: "PLATAFORMA",
          totem_id: "",
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.description.trim()) {
      setError("La descripción es obligatoria");
      return;
    }

    if (form.tipo === "TOTEM" && !form.totem_id) {
      setError("Debes seleccionar un Tótem para este tipo de llave");
      return;
    }

    try {
      const success = await onSubmit(form);
      if (success) onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear la llave");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40  transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{initialData ? 'Editar API Key' : 'Generar API Key'}</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{initialData ? 'Actualizar Credencial' : 'Nueva Credencial'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                Descripción
              </label>
              <input
                autoFocus
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Acceso Administrador, Tótem Plaza Central..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, tipo: "PLATAFORMA", totem_id: "" })}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                  form.tipo === "PLATAFORMA"
                    ? "border-slate-900 bg-slate-50 text-slate-900 shadow-md"
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                }`}
              >
                <Shield size={24} className={form.tipo === "PLATAFORMA" ? "text-slate-900" : "text-slate-300"} />
                <span className="text-xs font-black uppercase tracking-tighter">Plataforma</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, tipo: "TOTEM" })}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                  form.tipo === "TOTEM"
                    ? "border-slate-900 bg-slate-50 text-slate-900 shadow-md"
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                }`}
              >
                <TabletSmartphone size={24} className={form.tipo === "TOTEM" ? "text-slate-900" : "text-slate-300"} />
                <span className="text-xs font-black uppercase tracking-tighter">Tótem</span>
              </button>
            </div>

            {form.tipo === "TOTEM" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                  Seleccionar Tótem
                </label>
                <select
                  value={form.totem_id}
                  onChange={(e) => setForm({ ...form, totem_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all shadow-sm appearance-none"
                >
                  <option value="">Selecciona un equipo...</option>
                  {totems.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.identificador} ({t.direccion})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  {initialData ? 'Guardar Cambios' : 'Generar Key'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
