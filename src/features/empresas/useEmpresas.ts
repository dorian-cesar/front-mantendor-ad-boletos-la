import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/empresas");
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching empresas:", error);
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
        body: JSON.stringify({
          nombre: form.nombre,
          rut: form.rut,
          direccion: form.direccion,
          status: form.status,
        }),
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
    fetchEmpresas,
    handleUpdate,
    handleDelete,
  };
}
