import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export interface SalesSummary {
  total_ventas: number;
  monto_total: number;
  exitosas: number;
  fallidas: number;
}

export interface Sale {
  id: number;
  totem_id: number;
  payload_request: any;
  payload_response: any;
  ticket_numbers: string[];
  total_amount: number;
  status: string;
  operation: string;
  provider: string;
  timestamp_operacion: string;
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = "";
      if (filters.startDate && filters.endDate) {
        query = `?startDate=${filters.startDate}&endDate=${filters.endDate}`;
      } else if (filters.startDate) {
        query = `?startDate=${filters.startDate}`;
      }

      const data = await apiFetch(`/ventas/auditoria${query}`);
      
      setSales(data.ventas || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error("Error fetching sales:", err);
      setError(err.message || "Error al cargar las ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    // Auto-refresh cada 15 segundos
    const interval = setInterval(() => {
      fetchSales();
    }, 15000);

    return () => clearInterval(interval);
  }, [filters]);

  return {
    sales,
    summary,
    loading,
    error,
    filters,
    setFilters,
    fetchSales
  };
}
