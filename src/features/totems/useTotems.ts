import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useTotems() {
  const [totems, setTotems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTotems = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/totems");
      setTotems(data);
    } catch (error) {
      console.error("Error fetching totems:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotems();
  }, []);

  const handleSave = async (id: string, editForm: any) => {
    try {
      setIsSaving(true);
      await apiFetch(`/totems/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          identificador: editForm.identificador,
          direccion: editForm.direccion,
          video_ids: editForm.video_ids || [],
        }),
      });
      await fetchTotems();
      return true;
    } catch (error) {
      console.error("Error saving totem:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (createForm: any) => {
    try {
      setIsSaving(true);
      await apiFetch("/totems", {
        method: "POST",
        body: JSON.stringify({
          identificador: createForm.identificador,
          direccion: createForm.direccion,
          video_ids: [],
        }),
      });
      await fetchTotems();
      return true;
    } catch (error) {
      console.error("Error creating totem:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este tótem?")) return;
    try {
      await apiFetch(`/totems/${id}`, { method: "DELETE" });
      await fetchTotems();
    } catch (error) {
      console.error("Error deleting totem:", error);
      throw error;
    }
  };

  return {
    totems,
    loading,
    isSaving,
    fetchTotems,
    handleSave,
    handleCreate,
    handleDelete,
  };
}
