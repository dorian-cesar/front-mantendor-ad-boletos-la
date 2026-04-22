"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileVideo, Loader2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { apiFetch } from '@/lib/api';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadVideoModal({ isOpen, onClose, onSuccess }: UploadVideoModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [loaded, setLoaded] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Inicializando conversor...");
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchEmpresas = async () => {
    try {
      const data = await apiFetch("/empresas");
      if (Array.isArray(data) && data.length > 0) {
        setEmpresas(data);
        setSelectedEmpresa(data[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching empresas:", error);
    }
  };

  useEffect(() => {
    if (isOpen) fetchEmpresas();
  }, [isOpen]);

  const loadFFmpeg = async () => {
    if (typeof window === 'undefined') return;
    if (!ffmpegRef.current) ffmpegRef.current = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setLoaded(true);
    } catch (e) {
        console.error("Error loading FFmpeg", e);
    }
  };

  useEffect(() => {
    if (isOpen && !loaded && (!ffmpegRef.current || !ffmpegRef.current.loaded)) {
      loadFFmpeg();
    }
  }, [isOpen, loaded]);

  const handleClose = () => {
    if (isCompressing) return;
    setFile(null);
    setProgress(0);
    setIsCompressing(false);
    onClose();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!isCompressing && e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type.includes('video')) setFile(f);
    }
  };

  const compressAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !ffmpegRef.current) return;

    setIsCompressing(true);
    const ffmpeg = ffmpegRef.current;

    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      await ffmpeg.exec(['-i', 'input.mp4', '-vcodec', 'libx264', '-crf', '28', '-preset', 'ultrafast', 'output.mp4']);
      
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data as Uint8Array], { type: 'video/mp4' });
      
      const formData = new FormData();
      formData.append("video", blob, file.name || "video.mp4");
      formData.append("nombre", title);
      formData.append("descripcion", description);
      formData.append("empresa_id", selectedEmpresa);

      await apiFetch('/videos', {
        method: 'POST',
        body: formData
      });

      if (onSuccess) onSuccess();
      handleClose();

    } catch (error) {
      console.error("Compression error:", error);
      setIsCompressing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden font-sans border border-slate-100 mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">Subir Nuevo Video</h3>
          <button onClick={handleClose} disabled={isCompressing} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <form className="space-y-4" onSubmit={compressAndUpload}>
            <input 
              type="text" placeholder="Título del Video" required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              value={title} onChange={e => setTitle(e.target.value)}
              disabled={isCompressing}
            />

            <div className="grid grid-cols-2 gap-4">
                <select 
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={selectedEmpresa} onChange={e => setSelectedEmpresa(e.target.value)}
                    required disabled={isCompressing}
                >
                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>
                <input 
                    type="text" placeholder="Descripción..."
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={description} onChange={e => setDescription(e.target.value)}
                    disabled={isCompressing}
                />
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className="space-y-2">
                <UploadCloud className="mx-auto text-blue-600" size={32} />
                <div className="text-sm font-semibold text-blue-600">
                    {file ? file.name : "Selecciona un video"}
                    <input type="file" className="sr-only" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                {file && <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>}
              </div>
            </div>

            {isCompressing && (
                <div className="bg-slate-50 border p-4 rounded-xl">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Comprimiendo...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleClose} disabled={isCompressing} className="px-5 py-2.5 border rounded-xl">Cancelar</button>
              <button type="submit" disabled={isCompressing || !loaded} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl">
                {!loaded ? "Cargando motor..." : isCompressing ? "Procesando..." : "Comprimir y Subir"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
