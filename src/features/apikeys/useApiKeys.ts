import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/api-keys");
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching API keys:", err);
      setError(err.message || "Error al cargar las llaves");
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreateKey = async (form: { description: string; tipo: "PLATAFORMA" | "TOTEM"; totem_id?: number | null }) => {
    try {
      setIsSaving(true);
      // Validar según requerimientos
      const payload: any = {
        description: form.description,
        tipo: form.tipo,
      };
      
      if (form.tipo === "TOTEM") {
        if (!form.totem_id) throw new Error("El ID de Tótem es obligatorio para llaves de tipo TOTEM");
        payload.totem_id = Number(form.totem_id);
      } else {
        // Para PLATAFORMA no se envía totem_id o se envía null
        payload.totem_id = null;
      }

      await apiFetch("/api-keys", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await fetchApiKeys();
      return true;
    } catch (err: any) {
      console.error("Error creating API key:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateKey = async (id: number, form: { description?: string; status?: boolean; tipo?: "PLATAFORMA" | "TOTEM"; totem_id?: number | null }) => {
    try {
      setIsSaving(true);
      const payload: any = { ...form };
      
      if (payload.tipo === "PLATAFORMA") {
        payload.totem_id = null;
      } else if (payload.tipo === "TOTEM" && payload.totem_id) {
        payload.totem_id = Number(payload.totem_id);
      }

      await apiFetch(`/api-keys/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await fetchApiKeys();
      return true;
    } catch (err: any) {
      console.error("Error updating API key:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta API Key?")) return;
    try {
      await apiFetch(`/api-keys/${id}`, { method: "DELETE" });
      await fetchApiKeys();
      return true;
    } catch (err: any) {
      console.error("Error deleting API key:", err);
      throw err;
    }
  };

  return {
    apiKeys,
    loading,
    error,
    isSaving,
    fetchApiKeys,
    handleCreateKey,
    handleUpdateKey,
    handleDeleteKey,
  };
}
