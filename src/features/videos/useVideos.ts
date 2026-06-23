import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socketClient";

export function useVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchVideos = async (silent = false) => {
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await apiFetch("/videos", { signal: controller.signal });
      setVideos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Fetch videos aborted");
        return;
      }
      console.error("Error fetching videos:", err);
      if (!silent) {
        setError(err.message || "Error al cargar videos");
        setVideos([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    return () => {
      // Clean up by aborting any pending request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Escuchar actualizaciones en tiempo real vía WebSockets
  useEffect(() => {
    const socket = getSocket();
    const handleVideosUpdated = (newVideos: any[]) => {
      console.log("🔍 [WS:DEBUG] Evento recibido → 'admin:videos_updated'", newVideos);
      setVideos(Array.isArray(newVideos) ? newVideos : []);
    };

    socket.on("admin:videos_updated", handleVideosUpdated);

    return () => {
      socket.off("admin:videos_updated", handleVideosUpdated);
    };
  }, []);

  // Desactivado temporalmente para no saturar la red hasta que se implementen WebSockets en el backend.
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[Polling] Refrescando videos en segundo plano...");
      fetchVideos(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  */

  const getVideoById = async (id: string) => {
    try {
      const data = await apiFetch(`/videos/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      throw error;
    }
  };

  const handleUpdate = async (
    id: string,
    updateData: any,
    method: "PUT" | "PATCH" = "PUT"
  ) => {
    // Optimistic update: reflect changes immediately in local state
    setVideos((prev) =>
      prev.map((v) =>
        String(v.id) === String(id) ? { ...v, ...updateData } : v
      )
    );
    try {
      const result = await apiFetch(`/videos/${id}`, {
        method,
        body: JSON.stringify(updateData),
      });
      console.log(`[Video ${method}] Server response for id=${id}:`, result);
      // If the backend returns the updated video object, merge it into the
      // specific video in state for server-confirmed data.
      if (result && typeof result === "object" && result.id) {
        setVideos((prev) =>
          prev.map((v) =>
            String(v.id) === String(id) ? { ...v, ...result } : v
          )
        );
      }
      // Return server response so callers can verify field persistence
      return result;
    } catch (error) {
      console.error(`[Video ${method}] Error updating video ${id}:`, error);
      // Revert optimistic update on failure by fetching server state
      fetchVideos();
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/videos/${id}`, { method: "DELETE" });
      await fetchVideos();
      return true;
    } catch (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  };

  return {
    videos,
    loading,
    error,
    fetchVideos: () => fetchVideos(false),
    handleDelete,
    handleUpdate,
    getVideoById,
  };
}
