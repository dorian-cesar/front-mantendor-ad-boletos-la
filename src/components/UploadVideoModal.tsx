"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileVideo, Loader2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { apiFetch } from '@/lib/api';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadVideoModal({ isOpen, onClose }: UploadVideoModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // States para FFmpeg
  const [loaded, setLoaded] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Inicializando conversor...");
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // States para Formulario real
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
      } else {
        setEmpresas([]);
      }
    } catch (error) {
      console.error("Error fetching empresas:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
        fetchEmpresas();
    }
  }, [isOpen]);

  const loadFFmpeg = async () => {
    if (typeof window === 'undefined') return;
    
    if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    // Configurar listeners de Wasm FFmpeg
    ffmpeg.on('log', ({ message }) => {
      console.log("[FFmpeg log]", message);
    });
    
    ffmpeg.on('progress', ({ progress }) => {
      // ffmpeg reporta progress del 0 al 1 (ej: 0.14 = 14%)
      let p = Math.round(progress * 100);
      if(p > 100) p = 100;
      if(p < 0) p = 0;
      setProgress(p);
    });

    try {
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setLoaded(true);
    } catch (e) {
        console.error("Error cargando caché FFmpeg", e);
    }
  };

  useEffect(() => {
    if (isOpen && !loaded && (!ffmpegRef.current || !ffmpegRef.current.loaded)) {
      loadFFmpeg();
    }
  }, [isOpen, loaded]);

  const handleClose = () => {
    if (isCompressing) return; // evitar cierre forzado
    setFile(null);
    setProgress(0);
    setIsCompressing(false);
    setMessage("Inicializando conversor...");
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!isCompressing && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type.includes('video')) setFile(f);
    }
  };

  const compressAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsCompressing(true);
    setMessage("Comprimiendo video...");
    setProgress(0);

    const ffmpeg = ffmpegRef.current;

    try {
      // 1. Escribir archivo al FS virtual de ffmpeg
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));

      // 2. Ejecutar FFmpeg (Codificación H264 optimizada y rápida)
      // -crf 28 indica reducción robusta de peso. -preset ultrafast acelera la carga.
      await ffmpeg.exec(['-i', 'input.mp4', '-vcodec', 'libx264', '-crf', '28', '-preset', 'ultrafast', 'output.mp4']);

      setMessage("Preparando archivo de salida...");
      
      // 3. Leer resultado FS
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
      
      console.log("Compresión completada", {
        originalSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        compressedSize: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
      });

      setMessage("Subiendo al servidor...");
      
      // 4. LÓGICA DE SUBIDA REAL
      const formData = new FormData();
      formData.append("video", blob, file.name);
      formData.append("nombre", title);
      formData.append("descripcion", description);
      formData.append("empresa_id", selectedEmpresa);

      await apiFetch('/videos', {
        method: 'POST',
        body: formData
      });

      setMessage("¡Video subido con éxito!");
      
      setTimeout(() => {
         handleClose();
      }, 1000);

    } catch (error) {
      console.error("Error crítico durante la compresión:", error);
      setMessage("Ocurrió un error en la compresión.");
      setIsCompressing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all mr-0 md:mr-8 font-sans border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Subir Nuevo Video</h3>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full border border-slate-200 shadow-sm disabled:opacity-50"
            disabled={isCompressing}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6">
          <form className="space-y-4" onSubmit={compressAndUpload}>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ">Título del Video</label>
              <input 
                type="text" 
                placeholder="Ej: Reunión Anual Directorio" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm disabled:opacity-60"
                required
                disabled={isCompressing}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Asociar Empresa</label>
                    <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm outline-none"
                        value={selectedEmpresa}
                        onChange={e => setSelectedEmpresa(e.target.value)}
                        required
                        disabled={isCompressing}
                    >
                        {empresas.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción Corta</label>
                    <input 
                        type="text" 
                        placeholder="Breve detalle..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm outline-none"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        disabled={isCompressing}
                    />
                </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Archivo a Comprimir</label>
              <div 
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all ${dragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 bg-slate-50/80 hover:bg-slate-50'} ${isCompressing ? 'opacity-60 pointer-events-none border-solid border-slate-200 bg-slate-50' : ''}`}
                onDragOver={(e) => { e.preventDefault(); if (!isCompressing) setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="space-y-3 text-center">
                  <div className={`mx-auto h-14 w-14 shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-3 transition-colors ${file ? 'bg-blue-50 text-blue-600' : 'text-slate-400 bg-white'}`}>
                    {file ? <FileVideo size={26} className="text-blue-600" /> : <UploadCloud size={26} className="text-blue-600" />}
                  </div>
                  <div className="flex text-sm text-slate-600 justify-center">
                    <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2 py-0.5">
                      <span className="truncate max-w-[150px] inline-block align-bottom">{file ? file.name : "Selecciona un video"}</span>
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="video/mp4,video/x-m4v,video/*,video/quicktime" 
                        onChange={handleFileChange}
                        disabled={isCompressing}
                        required
                      />
                    </label>
                    {!file && <p className="pl-1">o arrástralo aquí</p>}
                  </div>
                  {!file && (
                    <p className="text-xs text-slate-500 font-medium tracking-wide border border-slate-200 bg-white inline-block px-3 py-1 rounded-full">
                      MP4, AVI, MOV hasta 500MB
                    </p>
                  )}
                  {file && (
                     <p className="text-xs font-semibold text-blue-700 bg-blue-100/50 inline-block px-3 py-1 rounded-full border border-blue-200">
                     Original: {(file.size / (1024 * 1024)).toFixed(1)} MB
                   </p>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de Progreso de Compresión FFmpeg */}
            {isCompressing && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-4 animate-in fade-in duration-300">
                 <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2.5">
                    <span className="flex items-center gap-1.5 text-blue-700"><Loader2 size={14} className="animate-spin"/> {message}</span>
                    <span className="text-blue-600">{progress}%</span>
                 </div>
                 <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>
            )}

            {/* Footer */}
            <div className={`pt-2 flex items-center justify-end gap-3 mt-4 ${isCompressing ? 'border-transparent' : 'border-t border-slate-100 mt-5 pt-5'}`}>
              <button 
                type="button" 
                onClick={handleClose}
                disabled={isCompressing && progress < 100}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isCompressing || !loaded}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100"
              >
                {!loaded ? <Loader2 size={18} className="animate-spin"/> : <FileVideo size={18} strokeWidth={2.5}/>}
                {!loaded ? "Cargando motor..." : isCompressing ? "Comprimiendo..." : "Comprimir y Subir"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
