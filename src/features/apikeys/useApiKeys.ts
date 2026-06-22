import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socketClient";

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchApiKeys = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await apiFetch("/api-keys");
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching API keys:", err);
      if (!silent) {
        setError(err.message || "Error al cargar las llaves");
        setApiKeys([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Escuchar actualizaciones en tiempo real vía WebSockets
  useEffect(() => {
    const socket = getSocket();
    const handleApiKeysUpdated = (newKeys: any[]) => {
      console.log("🔍 [WS:DEBUG] Evento recibido → 'admin:apikeys_updated'", newKeys);
      setApiKeys(Array.isArray(newKeys) ? newKeys : []);
    };

    socket.on("admin:apikeys_updated", handleApiKeysUpdated);

    return () => {
      socket.off("admin:apikeys_updated", handleApiKeysUpdated);
    };
  }, []);

  const handleCreateKey = async (form: { description: string; tipo: "PLATAFORMA" | "TOTEM"; totem_id?: number | null }) => {
    try {
      setIsSaving(true);
      const payload: any = {
        description: form.description,
        tipo: form.tipo,
      };

      if (form.tipo === "TOTEM") {
        if (!form.totem_id) throw new Error("El ID de Tótem es obligatorio para llaves de tipo TOTEM");
        payload.totem_id = Number(form.totem_id);
      } else {
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
    // Optimistic update: apply changes immediately in local state
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ...form } : k))
    );

    try {
      setIsSaving(true);
      const payload: any = { ...form };

      if (payload.tipo === "PLATAFORMA") {
        payload.totem_id = null;
      } else if (payload.tipo === "TOTEM" && payload.totem_id) {
        payload.totem_id = Number(payload.totem_id);
      }

      const result = await apiFetch(`/api-keys/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      // Merge confirmed server response if available
      if (result && typeof result === "object" && result.id) {
        setApiKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, ...result } : k))
        );
      }

      return true;
    } catch (err: any) {
      console.error("Error updating API key:", err);
      // Revert optimistic update on failure
      fetchApiKeys();
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta API Key?")) return;
    try {
      await apiFetch(`/api-keys/${id}`, { method: "DELETE" });
      // Remove the key directly from local state
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      return true;
    } catch (err: any) {
      console.error("Error deleting API key:", err);
      // Refetch to restore accurate state on failure
      fetchApiKeys();
      throw err;
    }
  };

  return {
    apiKeys,
    loading,
    error,
    isSaving,
    fetchApiKeys: () => fetchApiKeys(false),
    handleCreateKey,
    handleUpdateKey,
    handleDeleteKey,
  };
}
