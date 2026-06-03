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
    // Optimistic update: reflect changes immediately in local state
    setVideos((prev) =>
      prev.map((v) =>
        String(v.id) === String(id) ? { ...v, ...updateData } : v
      )
    );
    try {
      await apiFetch(`/videos/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      // Sync with server in background (don't block the UI)
      fetchVideos();
      return true;
    } catch (error) {
      console.error("Error updating video:", error);
      // Revert optimistic update on failure
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
    fetchVideos,
    handleDelete,
    handleUpdate,
    getVideoById,
  };
}
