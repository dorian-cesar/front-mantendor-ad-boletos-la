"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Loader2, Minimize2, FolderOpen, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useUpload } from './UploadContext';

interface UploadVideoModalProps {
  initialFile?: File | null;
  onSuccess?: () => void;
}

export function UploadVideoModal({ initialFile = null, onSuccess }: UploadVideoModalProps) {
  const { job, startUpload, retryUpload, minimizeModal, cancelUpload, orphanSession, resumeWithNewFile, dismissJob, isModalOpen, closeModal } = useUpload();
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [orphanFile, setOrphanFile] = useState<File | null>(null);
  const [orphanSizeError, setOrphanSizeError] = useState<string | null>(null);
  const orphanInputRef = useRef<HTMLInputElement>(null);
  
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isProcessing = job && (job.stage === "loading" || job.stage === "compressing" || job.stage === "uploading");
  // Modo recuperación: sesión huérfana detectada y ninguna subida activa
  const isOrphanMode = !!orphanSession && !job;

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
    if (isModalOpen) {
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
  }, [isModalOpen, initialFile]);

  const handleClose = () => {
    if (isProcessing) {
      // Si está procesando, minimizar en vez de cerrar
      minimizeModal();
      return;
    }
    setFile(null);
    setOrphanFile(null);
    setOrphanSizeError(null);
    closeModal();
  };

  const handleOrphanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setOrphanFile(f);
    if (f && orphanSession && f.size !== orphanSession.fileSize) {
      setOrphanSizeError(
        `El archivo seleccionado (${(f.size / 1024 / 1024).toFixed(1)} MB) no coincide con la sesión guardada (${(orphanSession.fileSize / 1024 / 1024).toFixed(1)} MB). Selecciona el archivo original.`
      );
    } else {
      setOrphanSizeError(null);
    }
  };

  const handleOrphanResume = () => {
    if (!orphanFile || orphanSizeError) return;
    resumeWithNewFile(orphanFile);
    setOrphanFile(null);
    setOrphanSizeError(null);
    // resumeWithNewFile ya maneja el estado del modal
  };

  const handleOrphanDiscard = () => {
    dismissJob();
    setOrphanFile(null);
    setOrphanSizeError(null);
    closeModal();
  };

  const handleMinimize = () => {
    minimizeModal();
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
    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden font-sans border border-slate-100 dark:border-zinc-800 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Subir Nuevo Video</h3>
          <div className="flex items-center gap-1">
            {isProcessing && (
              <button 
                onClick={handleMinimize} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                title="Minimizar y continuar en segundo plano"
              >
                <Minimize2 size={16} />
              </button>
            )}
            <button 
              onClick={isProcessing ? handleMinimize : handleClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                  job.stage === "uploading" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-zinc-800 text-slate-500"
                }`}>
                  <Loader2 size={28} className={`animate-spin`} />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{job.message}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{job.fileName}</p>
                {job.chunkDetail && (
                  <p className="text-[10px] text-white font-medium mt-1 bg-slate-500 px-3 py-1 rounded-lg inline-block shadow-sm">{job.chunkDetail}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {job.stage === "compressing" ? "Compresión local" : job.stage === "uploading" ? "Subida al servidor" : "Preparando..."}
                  </span>
                  <span className={job.stage === "uploading" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}>
                    {job.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      job.stage === "uploading" 
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                        : "bg-slate-900 dark:bg-slate-100"
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleMinimize}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  <Minimize2 size={14} />
                  Segundo Plano
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : isOrphanMode && orphanSession ? (
            // Modo recuperación: sesión huérfana detectada tras recargar la página
            <div className="space-y-5 py-2">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
                <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Subida interrumpida detectada</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Se encontró una subida pendiente de <span className="font-semibold">{orphanSession.fileName}</span>{' '}
                    ({(orphanSession.fileSize / 1024 / 1024).toFixed(1)} MB). Selecciona el mismo archivo para reanudar desde donde quedó.
                  </p>
                </div>
              </div>

              <div
                className="border-2 border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-5 text-center cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                onClick={() => orphanInputRef.current?.click()}
              >
                <FolderOpen size={28} className="mx-auto text-amber-400 dark:text-amber-500 mb-2" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  {orphanFile ? orphanFile.name : 'Seleccionar archivo original'}
                </p>
                {orphanFile && !orphanSizeError && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">✓ Tamaño verificado ({(orphanFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                )}
                <input
                  ref={orphanInputRef}
                  type="file"
                  className="sr-only"
                  accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,video/*"
                  onChange={handleOrphanFileChange}
                />
              </div>

              {orphanSizeError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                  <AlertTriangle size={14} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">{orphanSizeError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOrphanDiscard}
                  className="px-5 py-2.5 bg-slate-800 dark:bg-zinc-800 border border-transparent rounded-xl hover:bg-slate-700 dark:hover:bg-zinc-700 transition-colors text-sm text-white"
                >
                  Descartar sesión
                </button>
                <button
                  type="button"
                  onClick={handleOrphanResume}
                  disabled={!orphanFile || !!orphanSizeError}
                  className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Reanudar Subida
                </button>
              </div>
            </div>
          ) : (
            // Formulario normal
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input 
                type="text" placeholder="Título del Video" required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 outline-none text-slate-900 dark:text-slate-100 transition-all"
                value={title} onChange={e => setTitle(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select 
                  className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all font-medium text-slate-900 dark:text-slate-100"
                  value={selectedEmpresa} onChange={e => setSelectedEmpresa(e.target.value)}
                  required
                >
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>
                <input 
                  type="text" placeholder="Descripción..."
                  className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all text-slate-900 dark:text-slate-100"
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-zinc-800' : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950'}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="space-y-2">
                  <UploadCloud className="mx-auto text-slate-400 dark:text-slate-500" size={32} />
                  <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 py-2 px-4 rounded-lg inline-block cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                    {file ? file.name : "Seleccionar Archivo"}
                <input type="file" className="sr-only" accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>
                  {file && <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleClose} className="px-5 py-2.5 bg-slate-800 dark:bg-zinc-800 border border-transparent rounded-xl hover:bg-slate-700 dark:hover:bg-zinc-700 text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={!file} className="px-8 py-2.5 bg-slate-900 dark:bg-zinc-800 border border-transparent text-white dark:text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-slate-900/20 dark:shadow-white/10 active:scale-95 transition-all disabled:opacity-30">
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
