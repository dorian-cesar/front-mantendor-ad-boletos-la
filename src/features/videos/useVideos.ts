import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/videos");
      setVideos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching videos:", err);
      setError(err.message || "Error al cargar videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const getVideoById = async (id: string) => {
    try {
      const data = await apiFetch(`/videos/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      throw error;
    }
  };

  const handleUpdate = async (id: string, updateData: any) => {
    try {
      await apiFetch(`/videos/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      await fetchVideos();
      return true;
    } catch (error) {
      console.error("Error updating video:", error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este video?")) return;
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
    fetchVideos,
    handleDelete,
    handleUpdate,
    getVideoById,
  };
}
