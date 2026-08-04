import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socketClient";

export interface SalesSummary {
  total_ventas: number;
  monto_total: number;
  exitosas: number;
  fallidas: number;
  ventas_vpos?: number;
  ventas_pos?: number;
  monto_vpos?: number;
  monto_pos?: number;
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
  tipo_pos?: string;
  timestamp_operacion: string;
  totem?: {
    identificador: string;
    direccion: string;
  };
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    totem_id: "",
  });

  // Keep a ref to current filters so the interval always reads the latest value
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchSales = useCallback(async (silent = false, currentFilters = filtersRef.current) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const { startDate, endDate, totem_id } = currentFilters;
      const params = new URLSearchParams();
      if (startDate) {
        // Enviar fecha de inicio a las 00:00 (string literal)
        params.append("fecha_inicio", `${startDate} 00:00:00`);
      }
      if (endDate) {
        // Enviar fecha de fin a las 23:59:59 (string literal)
        params.append("fecha_fin", `${endDate} 23:59:59`);
      }
      if (totem_id) params.append("totem_id", totem_id);
      
      const queryStr = params.toString() ? `?${params.toString()}` : "";

      const data = await apiFetch(`/ventas/auditoria${queryStr}`);
      const newSales: Sale[] = data.ventas || [];

      if (silent) {
        // Smart merge: add new rows at the top, update existing ones in-place.
        // This preserves any active sort/scroll position for existing rows.
        setSales((prev) => {
          const prevMap = new Map(prev.map((s) => [s.id, s]));
          const newMap = new Map(newSales.map((s) => [s.id, s]));

          // Update existing rows with fresh data (status changes, etc.)
          const merged = prev.map((s) => newMap.get(s.id) ?? s);

          // Prepend truly new sales (IDs not present in prev)
          const brandNew = newSales.filter((s) => !prevMap.has(s.id));
          return [...brandNew, ...merged];
        });
      } else {
        setSales(newSales);
      }

      setSummary(data.summary || null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Error fetching sales:", err);
      setError(err.message || "Error al cargar las ventas");
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  }, []);

  // Initial load + re-fetch whenever filters change (non-silent, shows spinner)
  useEffect(() => {
    fetchSales(false, filters);
  }, [filters, fetchSales]);

  // Escuchar actualizaciones en tiempo real vía WebSockets
  useEffect(() => {
    const socket = getSocket();
    const handleVentasUpdated = () => {
      console.log("🔍 [WS:DEBUG] Evento recibido → 'admin:ventas_updated', refrescando silenciosamente...");
      fetchSales(true);
    };

    socket.on("admin:ventas_updated", handleVentasUpdated);

    return () => {
      socket.off("admin:ventas_updated", handleVentasUpdated);
    };
  }, [fetchSales]);

  return {
    sales,
    summary,
    loading,
    isRefreshing,
    error,
    lastRefreshed,
    filters,
    setFilters,
    fetchSales: () => fetchSales(false, filtersRef.current),
  };
}
