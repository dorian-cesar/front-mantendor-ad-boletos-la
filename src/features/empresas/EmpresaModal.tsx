"use client";

import React, { useState } from 'react';
import { X, Building, Save, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface EmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmpresaModal({ isOpen, onClose, onSuccess }: EmpresaModalProps) {
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    setNombre("");
    setEstado("Activo");
    setDone(false);
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        await apiFetch('/empresas', {
            method: 'POST',
            body: JSON.stringify({
                nombre,
                status: estado === "Activo" ? true : false
            })
        });
        setIsSaving(false);
        setDone(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
            handleClose();
        }, 1500);
    } catch (error) {
        alert("Error al registrar: " + (error as Error).message);
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100 dark:border-zinc-800 mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Nueva Empresa</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Registro de Partner</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-full border border-slate-200 dark:border-zinc-700 shadow-sm"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8">
          {done ? (
            <div className="py-10 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500 text-emerald-600 dark:text-white rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white">¡Empresa Registrada!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">El ID ha sido generado automáticamente.</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl flex items-center gap-4 mb-2">
                    <div className="p-2 bg-white dark:bg-blue-500 rounded-xl shadow-sm text-blue-600 dark:text-white">
                        <Building size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">ID del Registro</span>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400 italic">Auto-generado por el sistema</span>
                    </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Nombre de la Empresa</label>
                  <input 
                    type="text" 
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Transportes Interurbano S.A." 
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-zinc-950 transition-all shadow-sm"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Estado Inicial</label>
                        <select 
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-zinc-950 transition-all shadow-sm cursor-pointer"
                            disabled={isSaving}
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 py-3.5 text-sm font-bold text-white bg-slate-800 dark:bg-zinc-800 border border-transparent rounded-2xl hover:bg-slate-700 dark:hover:bg-zinc-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving || !nombre}
                  className="flex-[2] py-3.5 text-sm font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-500/10 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} strokeWidth={2.5}/>
                  )}
                  {isSaving ? "Guardando..." : "Registrar Empresa"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
