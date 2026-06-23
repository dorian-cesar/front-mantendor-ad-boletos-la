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
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 mx-4 max-h-[90vh] overflow-y-auto transition-colors">
        <div className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-white/10">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{initialData ? 'Editar API Key' : 'Generar API Key'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{initialData ? 'Actualizar Credencial' : 'Nueva Credencial'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
                Descripción
              </label>
              <input
                autoFocus
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Acceso Administrador, Tótem Plaza Central..."
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, tipo: "PLATAFORMA", totem_id: "" })}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                  form.tipo === "PLATAFORMA"
                    ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-md"
                    : "border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-zinc-700"
                }`}
              >
                <Shield size={24} className={form.tipo === "PLATAFORMA" ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"} />
                <span className="text-xs font-black uppercase tracking-tighter">Plataforma</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, tipo: "TOTEM" })}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                  form.tipo === "TOTEM"
                    ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-md"
                    : "border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-zinc-700"
                }`}
              >
                <TabletSmartphone size={24} className={form.tipo === "TOTEM" ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"} />
                <span className="text-xs font-black uppercase tracking-tighter">Tótem</span>
              </button>
            </div>

            {form.tipo === "TOTEM" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Seleccionar Tótem
                </label>
                <select
                  value={form.totem_id}
                  onChange={(e) => setForm({ ...form, totem_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-sm appearance-none"
                >
                  <option value="">Selecciona un equipo...</option>
                  {totems.map((t) => (
                    <option key={t.id} value={t.id} className="dark:bg-zinc-900">
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
              className="flex-1 px-6 py-3.5 rounded-xl text-sm font-bold bg-slate-800 dark:bg-zinc-800 text-white hover:bg-slate-700 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 dark:shadow-white/10 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
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
