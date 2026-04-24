import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useTotems() {
  const [totems, setTotems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTotems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/totems");
      setTotems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching totems:", err);
      setError(err.message || "Error al cargar equipos");
      setTotems([]);
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

      const payload = {
        identificador: editForm.identificador,
        direccion: editForm.direccion,
        latitud: editForm.latitud || 0,
        longitud: editForm.longitud || 0,
        video_ids: editForm.video_ids || [],
        empresa_ids: editForm.empresa_ids || [],
        status: editForm.status
      };

      console.log(">>> ENVIANDO PAYLOAD FINAL AL BACKEND:", payload);

      await apiFetch(`/totems/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
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
          latitud: createForm.latitud || 0,
          longitud: createForm.longitud || 0,
          video_ids: createForm.video_ids || [],
          empresa_ids: createForm.empresa_ids || [],
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
    error,
    isSaving,
    fetchTotems,
    handleSave,
    handleCreate,
    handleDelete,
  };
}
