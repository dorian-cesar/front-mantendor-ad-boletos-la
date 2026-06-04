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
    fetchEmpresas,
    handleUpdate,
    handleDelete,
  };
}
