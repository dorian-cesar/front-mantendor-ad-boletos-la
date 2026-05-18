"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface UploadJob {
  fileName: string;
  stage: "loading" | "compressing" | "uploading" | "done" | "error";
  progress: number;
  message: string;
}

interface UploadContextType {
  job: UploadJob | null;
  isModalOpen: boolean;
  isMinimized: boolean;
  startUpload: (file: File, title: string, description: string, empresaId: string, onSuccess?: () => void) => void;
  cancelUpload: () => void;
  minimizeModal: () => void;
  restoreModal: () => void;
  openModal: (initialFile?: File | null) => void;
  closeModal: () => void;
  dismissJob: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be inside UploadProvider");
  return ctx;
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [job, setJob] = useState<UploadJob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const ffmpegLoadedRef = useRef(false);
  const onSuccessRef = useRef<(() => void) | undefined>(undefined);

  const loadFFmpeg = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (ffmpegLoadedRef.current && ffmpegRef.current?.loaded) return;

    if (!ffmpegRef.current) ffmpegRef.current = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("progress", ({ progress }) => {
      setJob((prev) =>
        prev && prev.stage === "compressing"
          ? { ...prev, progress: Math.round(progress * 100) }
          : prev
      );
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegLoadedRef.current = true;
    } catch (e) {
      console.error("Error loading FFmpeg", e);
    }
  }, []);

  const uploadWithProgress = useCallback(
    (endpoint: string, formData: FormData): Promise<any> => {
      return new Promise(async (resolve, reject) => {
        try {
          // 1. Obtener la URL de subida directa y API key desde el servidor
          const configRes = await fetch("/api/upload-config");
          if (!configRes.ok) {
            throw new Error("No se pudo obtener la configuración de subida");
          }
          const config = await configRes.json();

          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

          // 2. Subir directamente al backend (sin pasar por el proxy de Netlify)
          xhr.open("POST", config.uploadUrl, true);
          
          // Headers de autenticación
          xhr.setRequestHeader("x-api-key", config.apiKey);
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const pct = Math.round((event.loaded / event.total) * 100);
              setJob((prev) => (prev ? { ...prev, progress: pct } : prev));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                resolve(xhr.responseText);
              }
            } else {
              reject(new Error(`Error ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error("Error de red en la subida"));
          xhr.send(formData);
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  const startUpload = useCallback(
    async (file: File, title: string, description: string, empresaId: string, onSuccess?: () => void) => {
      onSuccessRef.current = onSuccess;

      // Minimizar el modal al iniciar
      setIsMinimized(true);
      setIsModalOpen(false);

      const MAX_SIZE_NO_COMPRESS = 9 * 1024 * 1024; // 9MB
      let fileToUpload: Blob = file;

      if (file.size <= MAX_SIZE_NO_COMPRESS) {
        // Archivo pequeño: subir directamente sin comprimir
        console.log(`[Upload] Archivo de ${(file.size / 1024 / 1024).toFixed(1)}MB (≤9MB), subiendo directo sin compresión`);
      } else {
        // Archivo grande: intentar comprimir
        setJob({
          fileName: file.name,
          stage: "loading",
          progress: 0,
          message: "Preparando motor de compresión...",
        });

      try {
        // 1. Intentar cargar FFmpeg con timeout de 15s
        console.log("[Upload] Intentando cargar FFmpeg...");
        const ffmpegLoaded = await Promise.race([
          loadFFmpeg().then(() => ffmpegLoadedRef.current),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 15000)),
        ]);

        if (ffmpegLoaded && ffmpegRef.current) {
          // 2. Comprimir con FFmpeg
          console.log("[Upload] FFmpeg disponible, comprimiendo...");
          const ffmpeg = ffmpegRef.current;

          setJob({
            fileName: file.name,
            stage: "compressing",
            progress: 0,
            message: "Comprimiendo y optimizando video...",
          });

          try {
            await ffmpeg.writeFile("input.mp4", await fetchFile(file));
            await ffmpeg.exec(["-i", "input.mp4", "-vcodec", "libx264", "-crf", "28", "-preset", "ultrafast", "output.mp4"]);
            const data = await ffmpeg.readFile("output.mp4");
            fileToUpload = new Blob([data as unknown as BlobPart], { type: "video/mp4" });
            console.log(`[Upload] Compresión exitosa: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`);
          } catch (compressErr) {
            console.warn("[Upload] Compresión falló, subiendo archivo original:", compressErr);
            fileToUpload = file;
          }
        } else {
          console.warn("[Upload] FFmpeg no disponible (timeout o error), subiendo archivo original sin compresión");
        }
       } catch (ffmpegErr) {
        console.warn("[Upload] Error en pipeline FFmpeg, continuando sin compresión:", ffmpegErr);
        fileToUpload = file;
       }
      } // fin del else (archivo > 9MB)

      // 3. Subir (ya sea comprimido o el original)
      try {
        const formData = new FormData();
        formData.append("video", fileToUpload, file.name || "video.mp4");
        formData.append("nombre", title);
        formData.append("descripcion", description);
        formData.append("empresa_id", empresaId);

        setJob({
          fileName: file.name,
          stage: "uploading",
          progress: 0,
          message: `Subiendo ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB al servidor...`,
        });

        console.log(`[Upload] Iniciando subida: ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`);
        await uploadWithProgress("/videos", formData);

        // 4. Éxito
        setJob({
          fileName: file.name,
          stage: "done",
          progress: 100,
          message: "¡Video subido exitosamente!",
        });

        console.log("[Upload] ✅ Subida completada");
        if (onSuccessRef.current) onSuccessRef.current();

        // Auto-dismiss after 4s
        setTimeout(() => {
          setJob(null);
          setIsMinimized(false);
        }, 4000);
      } catch (uploadErr: any) {
        console.error("[Upload] ❌ Error en subida:", uploadErr);
        setJob({
          fileName: file.name,
          stage: "error",
          progress: 0,
          message: uploadErr.message || "Error al subir el video",
        });
      }
    },
    [loadFFmpeg, uploadWithProgress]
  );

  const cancelUpload = useCallback(() => {
    if (ffmpegRef.current) {
      try {
        ffmpegRef.current.terminate();
        ffmpegRef.current = null;
        ffmpegLoadedRef.current = false;
      } catch (e) {
        console.error("Error terminando FFmpeg:", e);
      }
    }
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setJob(null);
    setIsMinimized(false);
    setIsModalOpen(false);
  }, []);

  const minimizeModal = useCallback(() => {
    setIsMinimized(true);
    setIsModalOpen(false);
  }, []);

  const restoreModal = useCallback(() => {
    setIsMinimized(false);
    setIsModalOpen(true);
  }, []);

  const openModal = useCallback((initialFile?: File | null) => {
    setIsModalOpen(true);
    setIsMinimized(false);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const dismissJob = useCallback(() => {
    setJob(null);
    setIsMinimized(false);
  }, []);

  return (
    <UploadContext.Provider
      value={{
        job,
        isModalOpen,
        isMinimized,
        startUpload,
        cancelUpload,
        minimizeModal,
        restoreModal,
        openModal,
        closeModal,
        dismissJob,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}
