import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/empresas");
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching empresas:", err);
      setError(err.message || "Error al cargar empresas");
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleUpdate = async (id: string, form: any) => {
    try {
      await apiFetch(`/empresas/${id}`, {
        method: "PUT",
        // Enviamos todo el form completo por si el backend necesita otros campos
        body: JSON.stringify(form),
      });
      await fetchEmpresas();
      return true;
    } catch (error) {
      console.error("Error updating empresa:", error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta empresa?")) return;
    try {
      await apiFetch(`/empresas/${id}`, { method: "DELETE" });
      await fetchEmpresas();
      return true;
    } catch (error) {
      console.error("Error deleting empresa:", error);
      throw error;
    }
  };

  return {
    empresas,
    loading,
    error,
    fetchEmpresas,
    handleUpdate,
    handleDelete,
  };
}
