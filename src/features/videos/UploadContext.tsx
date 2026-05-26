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

  const uploadChunksWithProgress = useCallback(
    async (file: Blob, title: string, description: string, empresaId: string, originalName: string): Promise<any> => {
      const configRes = await fetch("/api/upload-config");
      if (!configRes.ok) throw new Error("No se pudo obtener la configuración de subida");
      const config = await configRes.json();
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB por chunk
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const identifier = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      let finalResult = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk, "chunk.blob");
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());
        formData.append("identifier", identifier);
        formData.append("originalName", originalName);

        // Si es el último chunk, mandamos los metadatos de creación
        if (chunkIndex === totalChunks - 1) {
          formData.append("nombre", title);
          formData.append("descripcion", description);
          formData.append("empresa_id", empresaId);
        }

        let chunkSuccess = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!chunkSuccess && attempts < maxAttempts) {
          try {
            finalResult = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhrRef.current = xhr;
              xhr.open("POST", `${config.uploadUrl}/chunk`, true);
              xhr.setRequestHeader("x-api-key", config.apiKey);
              if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const chunkProgress = event.loaded / event.total;
                  const globalPct = Math.round(((chunkIndex + chunkProgress) / totalChunks) * 100);
                  setJob((prev) => (prev ? { ...prev, progress: globalPct } : prev));
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
                  reject(new Error(`Error ${xhr.status}: ${xhr.responseText}`));
                }
              };

              xhr.onerror = () => reject(new Error("Error de red en la subida"));
              xhr.send(formData);
            });
            
            chunkSuccess = true;
          } catch (err) {
            attempts++;
            console.warn(`[Upload] Fragmento ${chunkIndex + 1}/${totalChunks} falló. Reintento ${attempts}/${maxAttempts}...`);
            if (attempts >= maxAttempts) {
              throw new Error(`Fallo definitivo al subir el fragmento ${chunkIndex + 1} tras ${maxAttempts} intentos.`);
            }
            // Retraso exponencial: 2s, 4s, 8s...
            await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 1000));
          }
        }
      }

      return finalResult;
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
            
            // ¡CRÍTICO PARA LA MEMORIA! Limpiar el sistema de archivos virtual de WebAssembly
            try {
              await ffmpeg.deleteFile("input.mp4");
              await ffmpeg.deleteFile("output.mp4");
              console.log("[Upload] Caché de FFmpeg limpiada correctamente.");
            } catch (cleanupErr) {
              console.warn("[Upload] Error limpiando caché de FFmpeg:", cleanupErr);
            }
            
            console.log(`[Upload] Compresión exitosa: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`);
          } catch (compressErr) {
            console.warn("[Upload] Compresión falló, subiendo archivo original:", compressErr);
            fileToUpload = file;
            // Intentar limpiar en caso de error
            try {
              await ffmpeg.deleteFile("input.mp4");
              await ffmpeg.deleteFile("output.mp4");
            } catch (e) {}
          }
        } else {
          console.warn("[Upload] FFmpeg no disponible (timeout o error), subiendo archivo original sin compresión");
        }
       } catch (ffmpegErr) {
        console.warn("[Upload] Error en pipeline FFmpeg, continuando sin compresión:", ffmpegErr);
        fileToUpload = file;
       }
      } // fin del else (archivo > 9MB)

      // 3. Subir (ya sea comprimido o el original) usando fragmentos (chunks)
      try {
        setJob({
          fileName: file.name,
          stage: "uploading",
          progress: 0,
          message: `Subiendo ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB al servidor...`,
        });

        console.log(`[Upload] Iniciando subida fragmentada: ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`);
        await uploadChunksWithProgress(fileToUpload, title, description, empresaId, file.name || "video.mp4");

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
    [loadFFmpeg, uploadChunksWithProgress]
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
