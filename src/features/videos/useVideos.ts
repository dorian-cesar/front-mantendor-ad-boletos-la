import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/videos");
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

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
    fetchVideos,
    handleDelete,
  };
}
