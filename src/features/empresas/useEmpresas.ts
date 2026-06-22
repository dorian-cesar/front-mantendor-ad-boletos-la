import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socketClient";

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await apiFetch("/empresas");
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching empresas:", err);
      if (!silent) {
        setError(err.message || "Error al cargar empresas");
        setEmpresas([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  // Escuchar actualizaciones en tiempo real vía WebSockets
  useEffect(() => {
    const socket = getSocket();
    const handleEmpresasUpdated = (newEmpresas: any[]) => {
      console.log("🔍 [WS:DEBUG] Evento recibido → 'admin:empresas_updated'", newEmpresas);
      setEmpresas(Array.isArray(newEmpresas) ? newEmpresas : []);
    };

    socket.on("admin:empresas_updated", handleEmpresasUpdated);

    return () => {
      socket.off("admin:empresas_updated", handleEmpresasUpdated);
    };
  }, []);

  // Desactivado temporalmente para no saturar la red hasta que se implementen WebSockets en el backend.
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[Polling] Refrescando empresas en segundo plano...");
      fetchEmpresas(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  */

  const handleUpdate = async (id: string, form: any) => {
    // Optimistic update: reflect changes immediately in local state
    setEmpresas((prev) =>
      prev.map((e) => (String(e.id) === String(id) ? { ...e, ...form } : e))
    );

    try {
      const result = await apiFetch(`/empresas/${id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      // Merge server-confirmed data if backend returns the updated object
      if (result && typeof result === "object" && result.id) {
        setEmpresas((prev) =>
          prev.map((e) => (String(e.id) === String(id) ? { ...e, ...result } : e))
        );
      }

      return true;
    } catch (error) {
      console.error("Error updating empresa:", error);
      // Revert optimistic update on failure
      fetchEmpresas();
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta empresa?")) return;
    try {
      await apiFetch(`/empresas/${id}`, { method: "DELETE" });
      // Remove directly from local state
      setEmpresas((prev) => prev.filter((e) => String(e.id) !== String(id)));
      return true;
    } catch (error) {
      console.error("Error deleting empresa:", error);
      // Refetch to restore accurate state on failure
      fetchEmpresas();
      throw error;
    }
  };

  return {
    empresas,
    loading,
    error,
    fetchEmpresas: () => fetchEmpresas(false),
    handleUpdate,
    handleDelete,
  };
}
