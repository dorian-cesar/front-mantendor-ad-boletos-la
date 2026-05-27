"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface UploadJob {
  fileName: string;
  stage: "loading" | "compressing" | "uploading" | "done" | "error";
  progress: number;
  message: string;
  /** Detalle de chunks para mostrar al usuario */
  chunkDetail?: string;
  /** Si es true, se puede reintentar la subida */
  canRetry?: boolean;
}

interface UploadContextType {
  job: UploadJob | null;
  isModalOpen: boolean;
  isMinimized: boolean;
  startUpload: (file: File, title: string, description: string, empresaId: string, onSuccess?: () => void) => void;
  retryUpload: () => void;
  cancelUpload: () => void;
  minimizeModal: () => void;
  restoreModal: () => void;
  openModal: (initialFile?: File | null) => void;
  closeModal: () => void;
  dismissJob: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

const SESSION_KEY = "upload_session";

interface SavedSession {
  uploadId: string;
  baseApiUrl: string;
  apiKey: string;
  totalChunks: number;
  chunkSize: number;
  fileName: string;
  fileSize: number;
  title: string;
  description: string;
  empresaId: string;
}

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
  const uploadIdRef = useRef<string | null>(null);
  const configUrlRef = useRef<string | null>(null);
  const ffmpegLoadedRef = useRef(false);
  const onSuccessRef = useRef<(() => void) | undefined>(undefined);
  const pendingFileRef = useRef<Blob | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── FFmpeg ────────────────────────────────────────────────
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

  // ─── Consultar chunks ya subidos ──────────────────────────
  const getServerChunkStatus = useCallback(async (
    baseApiUrl: string, uploadId: string, apiKey?: string
  ): Promise<number[]> => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${baseApiUrl}/videos/upload/${uploadId}/status`, {
        headers: {
          ...(apiKey && { "x-api-key": apiKey }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.received_chunks || [];
    } catch {
      return [];
    }
  }, []);

  // ─── Subida de chunks con reanudación ─────────────────────
  const uploadChunksWithProgress = useCallback(
    async (file: Blob, session: SavedSession): Promise<any> => {
      const { uploadId, baseApiUrl, apiKey, totalChunks, chunkSize } = session;
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // Consultar qué chunks ya están en el servidor
      const receivedChunks = await getServerChunkStatus(baseApiUrl, uploadId, apiKey);
      const receivedSet = new Set(receivedChunks);

      const pendingChunks: number[] = [];
      for (let i = 0; i < totalChunks; i++) {
        if (!receivedSet.has(i)) pendingChunks.push(i);
      }

      console.log(`[Upload] Recibidos: [${receivedChunks.sort((a,b)=>a-b).join(", ")}] (${receivedChunks.length}/${totalChunks})`);
      console.log(`[Upload] Pendientes: [${pendingChunks.join(", ")}] (${pendingChunks.length}/${totalChunks})`);

      // Informar al usuario si hay chunks ya subidos
      if (receivedChunks.length > 0 && pendingChunks.length > 0) {
        setJob((prev) => prev ? {
          ...prev,
          message: `Reanudando: ${receivedChunks.length} de ${totalChunks} fragmentos ya subidos`,
          chunkDetail: `✓ Fragmentos ${receivedChunks.sort((a,b)=>a-b).map(i => i + 1).join(", ")} | Pendientes: ${pendingChunks.map(i => i + 1).join(", ")}`,
          progress: Math.round((receivedChunks.length / totalChunks) * 100),
        } : prev);
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (pendingChunks.length === 0) {
        setJob((prev) => prev ? { ...prev, progress: 100, message: "Todos los fragmentos ya estaban subidos ✓" } : prev);
      }

      // AbortController para cancelación
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Subir solo los chunks faltantes
      for (let idx = 0; idx < pendingChunks.length; idx++) {
        const chunkIndex = pendingChunks[idx];
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        // iOS Safari Fix: Wrap the blob slice into a proper File object
        // Otherwise, fetch() with FormData drops the blob during upload
        const chunkFile = new File([chunk], "chunk.blob", { type: "application/octet-stream" });
        formData.append("chunk", chunkFile);

        let chunkSuccess = false;
        let attempts = 0;
        const maxAttempts = 100; // Reintentos casi infinitos para redes inestables

        while (!chunkSuccess && attempts < maxAttempts) {
          if (controller.signal.aborted) throw new Error("Subida cancelada");

          // Pausar si no hay conexión a internet
          while (typeof navigator !== "undefined" && !navigator.onLine) {
            if (controller.signal.aborted) throw new Error("Subida cancelada");
            setJob((prev) => prev ? { 
              ...prev, 
              message: "Sin conexión. Esperando red...", 
              chunkDetail: `Pausado en fragmento ${chunkIndex + 1}/${totalChunks}` 
            } : prev);
            await new Promise((r) => setTimeout(r, 3000));
          }

          try {
            const chunkRes = await fetch(
              `${baseApiUrl}/videos/upload/${uploadId}/chunk/${chunkIndex}`,
              {
                method: "PUT",
                headers: {
                  ...(apiKey && { "x-api-key": apiKey }),
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
                signal: controller.signal,
              }
            );

            if (!chunkRes.ok) {
              const errText = await chunkRes.text().catch(() => "sin detalle");
              throw new Error(`HTTP ${chunkRes.status}: ${errText}`);
            }

            chunkSuccess = true;
            const uploaded = receivedChunks.length + idx + 1;
            const globalPct = Math.round((uploaded / totalChunks) * 100);
            setJob((prev) => prev ? {
              ...prev,
              progress: globalPct,
              message: `Fragmento ${chunkIndex + 1}/${totalChunks} subido ✓`,
              chunkDetail: `${uploaded} de ${totalChunks} completados`,
            } : prev);
          } catch (err: any) {
            if (controller.signal.aborted) throw new Error("Subida cancelada");
            attempts++;
            console.warn(`[Upload] Fragmento ${chunkIndex + 1}/${totalChunks} falló (intento ${attempts}/${maxAttempts}):`, err?.message || err);
            
            if (attempts >= maxAttempts) {
              throw new Error(`Fallo definitivo en fragmento ${chunkIndex + 1}/${totalChunks} tras ${maxAttempts} intentos. Verifica tu conexión.`);
            }
            
            // Notificar al usuario que se está reintentando automáticamente
            setJob((prev) => prev ? {
              ...prev,
              message: `Red inestable. Reintentando...`,
              chunkDetail: `Fragmento ${chunkIndex + 1}/${totalChunks} (Intento ${attempts})`,
            } : prev);
            
            // Espera antes de reintentar (3 a 5 segundos)
            await new Promise((r) => setTimeout(r, Math.min(Math.pow(1.5, attempts) * 1000, 5000)));
          }
        }
      }

      // Completar y ensamblar
      setJob((prev) => prev ? {
        ...prev,
        progress: 100,
        message: "Ensamblando video en el servidor...",
        chunkDetail: `${totalChunks}/${totalChunks} fragmentos enviados`,
      } : prev);

      const completeRes = await fetch(`${baseApiUrl}/videos/upload/${uploadId}/complete`, {
        method: "POST",
        headers: {
          ...(apiKey && { "x-api-key": apiKey }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!completeRes.ok) {
        const errText = await completeRes.text().catch(() => "sin detalle");
        throw new Error(`Fallo al ensamblar: HTTP ${completeRes.status}: ${errText}`);
      }

      // Limpiar sesión persistida
      try { sessionStorage.removeItem(SESSION_KEY); } catch {}
      uploadIdRef.current = null;
      return await completeRes.json();
    },
    [getServerChunkStatus]
  );

  // ─── Inicio de subida (con compresión) ────────────────────
  const startUpload = useCallback(
    async (file: File, title: string, description: string, empresaId: string, onSuccess?: () => void) => {
      onSuccessRef.current = onSuccess;

      setIsMinimized(true);
      setIsModalOpen(false);

      const MAX_SIZE_NO_COMPRESS = 9 * 1024 * 1024; // 9MB
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      let fileToUpload: Blob = file;

      if (file.size <= MAX_SIZE_NO_COMPRESS) {
        console.log(`[Upload] Archivo de ${(file.size / 1024 / 1024).toFixed(1)}MB (≤9MB), subiendo directo sin compresión`);
      } else if (isMobile) {
        console.log(`[Upload] Dispositivo móvil detectado. Saltando compresión local para evitar bloqueos. Se subirá el archivo original (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      } else {
        // Archivo grande: comprimir con FFmpeg
        setJob({
          fileName: file.name,
          stage: "loading",
          progress: 0,
          message: "Preparando motor de compresión...",
        });

        try {
          console.log("[Upload] Intentando cargar FFmpeg...");
          const ffmpegLoaded = await Promise.race([
            loadFFmpeg().then(() => ffmpegLoadedRef.current),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 45000)),
          ]);

          if (ffmpegLoaded && ffmpegRef.current) {
            console.log("[Upload] FFmpeg disponible, comprimiendo...");
            const ffmpeg = ffmpegRef.current;

            setJob({
              fileName: file.name,
              stage: "compressing",
              progress: 0,
              message: `Comprimiendo video (${(file.size / 1024 / 1024).toFixed(1)}MB)...`,
            });

            try {
              await ffmpeg.writeFile("input.mp4", await fetchFile(file));
              await ffmpeg.exec(["-i", "input.mp4", "-vcodec", "libx264", "-crf", "28", "-preset", "ultrafast", "output.mp4"]);
              const data = await ffmpeg.readFile("output.mp4");
              fileToUpload = new Blob([data as unknown as BlobPart], { type: "video/mp4" });

              // Limpiar sistema de archivos virtual de WebAssembly
              try {
                await ffmpeg.deleteFile("input.mp4");
                await ffmpeg.deleteFile("output.mp4");
                console.log("[Upload] Caché de FFmpeg limpiada correctamente.");
              } catch (cleanupErr) {
                console.warn("[Upload] Error limpiando caché de FFmpeg:", cleanupErr);
              }

              const ratio = ((1 - fileToUpload.size / file.size) * 100).toFixed(0);
              console.log(`[Upload] Compresión exitosa: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB (-${ratio}%)`);
            } catch (compressErr) {
              console.warn("[Upload] Compresión falló, subiendo archivo original:", compressErr);
              fileToUpload = file;
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
      }

      // Guardar referencia al archivo para reintentos
      pendingFileRef.current = fileToUpload;

      // Subir usando fragmentos
      try {
        const CHUNK_SIZE = 2 * 1024 * 1024;
        const totalChunks = Math.ceil(fileToUpload.size / CHUNK_SIZE);

        setJob({
          fileName: file.name,
          stage: "uploading",
          progress: 0,
          message: `Iniciando subida: ${totalChunks} fragmentos de ${(CHUNK_SIZE / 1024 / 1024).toFixed(0)}MB`,
          chunkDetail: `0/${totalChunks} completados | ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB total`,
        });

        // Obtener config
        const configRes = await fetch("/api/upload-config");
        if (!configRes.ok) throw new Error("No se pudo obtener la configuración de subida");
        const config = await configRes.json();
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const baseApiUrl = config.uploadUrl.replace(/\/videos\/?$/, "");
        configUrlRef.current = baseApiUrl;

        // Inicializar sesión en el servidor
        const initRes = await fetch(`${baseApiUrl}/videos/upload/init`, {
          method: "POST",
          headers: {
            ...(config.apiKey && { "x-api-key": config.apiKey }),
            ...(token && { Authorization: `Bearer ${token}` }),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name || "video.mp4",
            total_size: fileToUpload.size,
            empresa_id: Number(empresaId),
            nombre: title,
            descripcion: description,
          }),
        });

        if (!initRes.ok) {
          const errText = await initRes.text().catch(() => "");
          throw new Error(`Fallo al inicializar subida: HTTP ${initRes.status} ${errText}`);
        }

        const initData = await initRes.json();
        const uploadId = initData.upload_id;
        uploadIdRef.current = uploadId;

        const session: SavedSession = {
          uploadId,
          baseApiUrl,
          apiKey: config.apiKey || "",
          totalChunks: initData.total_chunks || totalChunks,
          chunkSize: initData.chunk_size || CHUNK_SIZE,
          fileName: file.name,
          fileSize: fileToUpload.size,
          title,
          description,
          empresaId,
        };

        // Persistir sesión para poder reanudar
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}

        console.log(`[Upload] Sesión ${uploadId} creada: ${session.totalChunks} chunks`);
        await uploadChunksWithProgress(fileToUpload, session);

        // Éxito
        setJob({
          fileName: file.name,
          stage: "done",
          progress: 100,
          message: "¡Video subido exitosamente!",
          chunkDetail: `${session.totalChunks} fragmentos enviados y ensamblados`,
        });

        console.log("[Upload] ✅ Subida completada");
        pendingFileRef.current = null;
        if (onSuccessRef.current) onSuccessRef.current();

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
          canRetry: !!uploadIdRef.current && !!pendingFileRef.current,
          chunkDetail: uploadIdRef.current ? "Pulsa Reintentar para reanudar desde donde quedó" : undefined,
        });
      }
    },
    [loadFFmpeg, uploadChunksWithProgress]
  );

  // ─── Reanudar subida desde donde se quedó ─────────────────
  const retryUpload = useCallback(async () => {
    const file = pendingFileRef.current;
    let sessionStr: string | null = null;
    try { sessionStr = sessionStorage.getItem(SESSION_KEY); } catch {}

    if (!file || !sessionStr) {
      setJob((prev) => prev ? { ...prev, message: "No se puede reanudar: la sesión expiró. Intenta subir de nuevo.", canRetry: false } : prev);
      return;
    }

    const session: SavedSession = JSON.parse(sessionStr);

    setIsMinimized(true);
    setIsModalOpen(false);
    setJob({
      fileName: session.fileName,
      stage: "uploading",
      progress: 0,
      message: "Reanudando subida...",
      chunkDetail: "Consultando fragmentos ya recibidos en el servidor...",
    });

    try {
      await uploadChunksWithProgress(file, session);

      setJob({
        fileName: session.fileName,
        stage: "done",
        progress: 100,
        message: "¡Video subido exitosamente!",
        chunkDetail: `${session.totalChunks} fragmentos enviados y ensamblados`,
      });

      console.log("[Upload] ✅ Reanudación completada");
      pendingFileRef.current = null;
      if (onSuccessRef.current) onSuccessRef.current();

      setTimeout(() => {
        setJob(null);
        setIsMinimized(false);
      }, 4000);
    } catch (err: any) {
      console.error("[Upload] ❌ Error en reanudación:", err);
      setJob({
        fileName: session.fileName,
        stage: "error",
        progress: 0,
        message: err.message || "Error al reanudar la subida",
        canRetry: true,
        chunkDetail: "Puedes reintentar nuevamente",
      });
    }
  }, [uploadChunksWithProgress]);

  // ─── Cancelar ─────────────────────────────────────────────
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    // Abortar en el servidor
    if (uploadIdRef.current && configUrlRef.current) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      fetch(`${configUrlRef.current}/videos/upload/${uploadIdRef.current}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch((err) => console.error("Error abortando subida en servidor", err));
      uploadIdRef.current = null;
    }

    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    pendingFileRef.current = null;

    setJob(null);
    setIsMinimized(false);
    setIsModalOpen(false);
  }, []);

  const minimizeModal = useCallback(() => { setIsMinimized(true); setIsModalOpen(false); }, []);
  const restoreModal = useCallback(() => { setIsMinimized(false); setIsModalOpen(true); }, []);
  const openModal = useCallback((_?: File | null) => { setIsModalOpen(true); setIsMinimized(false); }, []);
  const closeModal = useCallback(() => { setIsModalOpen(false); }, []);

  const dismissJob = useCallback(() => {
    pendingFileRef.current = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
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
        retryUpload,
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
