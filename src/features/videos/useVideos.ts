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
    fetchVideos,
    handleDelete,
    handleUpdate,
    getVideoById,
  };
}
