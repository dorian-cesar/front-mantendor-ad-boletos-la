"use client";

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2, Minimize2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useUpload } from './UploadContext';

interface UploadVideoModalProps {
  isOpen: boolean;
  initialFile?: File | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadVideoModal({ isOpen, initialFile = null, onClose, onSuccess }: UploadVideoModalProps) {
  const { job, startUpload, minimizeModal, cancelUpload } = useUpload();
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isProcessing = job && (job.stage === "loading" || job.stage === "compressing" || job.stage === "uploading");

  const fetchEmpresas = async () => {
    try {
      const data = await apiFetch("/empresas");
      if (Array.isArray(data) && data.length > 0) {
        setEmpresas(data);
        setSelectedEmpresa(data[0].id.toString());
      } else {
        setEmpresas([]);
      }
    } catch (error: any) {
      if (error?.message !== "fetch failed") {
        console.error("Error fetching empresas in modal:", error);
      }
      setEmpresas([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmpresas();
      if (initialFile) {
        setFile(initialFile);
        const nameWithoutExt = initialFile.name.split('.').slice(0, -1).join('.');
        setTitle(nameWithoutExt);
      } else {
        setFile(null);
        setTitle("");
        setDescription("");
      }
    }
  }, [isOpen, initialFile]);

  const handleClose = () => {
    if (isProcessing) {
      // Si está procesando, minimizar en vez de cerrar
      minimizeModal();
      onClose();
      return;
    }
    setFile(null);
    onClose();
  };

  const handleMinimize = () => {
    minimizeModal();
    onClose();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!isProcessing && e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type.includes('video')) setFile(f);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    startUpload(file, title, description, selectedEmpresa, () => {
      if (onSuccess) onSuccess();
      handleClose();
    });
  };

  const handleCancel = () => {
    cancelUpload();
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden font-sans border border-slate-100 mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">Subir Nuevo Video</h3>
          <div className="flex items-center gap-1">
            {isProcessing && (
              <button 
                onClick={handleMinimize} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
                title="Minimizar y continuar en segundo plano"
              >
                <Minimize2 size={16} />
              </button>
            )}
            <button 
              onClick={isProcessing ? handleMinimize : handleClose} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isProcessing && job ? (
            // Estado de procesamiento en el modal abierto
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                  job.stage === "uploading" ? "bg-emerald-50" : "bg-slate-50"
                }`}>
                  <Loader2 size={28} className={`animate-spin ${
                    job.stage === "uploading" ? "text-emerald-600" : "text-slate-700"
                  }`} />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{job.message}</h4>
                <p className="text-xs text-slate-400 mt-1">{job.fileName}</p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500 uppercase tracking-wider">
                    {job.stage === "compressing" ? "Compresión local" : job.stage === "uploading" ? "Subida al servidor" : "Preparando..."}
                  </span>
                  <span className={job.stage === "uploading" ? "text-emerald-600" : "text-slate-900"}>
                    {job.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      job.stage === "uploading" 
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                        : "bg-slate-900"
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleMinimize}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  <Minimize2 size={14} />
                  Segundo Plano
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            // Formulario normal
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input 
                type="text" placeholder="Título del Video" required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                value={title} onChange={e => setTitle(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                  value={selectedEmpresa} onChange={e => setSelectedEmpresa(e.target.value)}
                  required
                >
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>
                <input 
                  type="text" placeholder="Descripción..."
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-300 bg-slate-50'}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="space-y-2">
                  <UploadCloud className="mx-auto text-slate-400" size={32} />
                  <div className="text-sm font-black text-slate-900 uppercase tracking-widest bg-white border border-slate-200 py-2 px-4 rounded-lg inline-block cursor-pointer hover:bg-slate-50 transition-all">
                    {file ? file.name : "Seleccionar Archivo"}
                    <input type="file" className="sr-only" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>
                  {file && <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleClose} className="px-5 py-2.5 border rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={!file} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-30">
                  Subir Ahora
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
