import React, { useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Download,
  Clock,
  RefreshCcw,
  Hash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { useSales } from "./useSales";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportToCSV } from "@/lib/exportUtils";

// ─── Types ─────────────────────────────────────────────────────────────────────
type SortField = "total_amount" | "status" | "timestamp_operacion" | null;
type SortDir = "asc" | "desc";

// ─── Sortable Column Header ────────────────────────────────────────────────────
function SortableHeader({
  label,
  field,
  current,
  direction,
  onClick,
  className = "",
}: {
  label: string;
  field: SortField;
  current: SortField;
  direction: SortDir;
  onClick: (f: SortField) => void;
  className?: string;
}) {
  const active = current === field;
  return (
    <th
      className={`px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none group ${className}`}
      onClick={() => onClick(field)}
    >
      <span className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors">
        {label}
        {active ? (
          direction === "asc" ? (
            <ArrowUp size={11} className="text-slate-700" />
          ) : (
            <ArrowDown size={11} className="text-slate-700" />
          )
        ) : (
          <ArrowUpDown size={10} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        )}
      </span>
    </th>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function SalesDashboard() {
  const { sales, summary, loading, isRefreshing, error, lastRefreshed, filters, setFilters, fetchSales } = useSales();
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Column sort state
  const [tableSort, setTableSort] = useState<{ field: SortField; direction: SortDir }>({
    field: "timestamp_operacion",
    direction: "desc",
  });

  const toggleSort = (field: SortField) => {
    setTableSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const handleSearch = () => {
    setFilters({ startDate: dateRange.start, endDate: dateRange.end });
  };

  const quickFilter = (type: string) => {
    const today = new Date();
    let start = new Date();
    if (type === "today") {
      start = today;
    } else if (type === "yesterday") {
      start.setDate(today.getDate() - 1);
    } else if (type === "last7") {
      start.setDate(today.getDate() - 7);
    } else if (type === "last30") {
      start.setDate(today.getDate() - 30);
    }
    const startStr = start.toISOString().split("T")[0];
    const endStr = today.toISOString().split("T")[0];
    setDateRange({ start: startStr, end: endStr });
    setFilters({ startDate: startStr, endDate: endStr });
  };

  const handleExport = () => {
    if (sortedSales.length === 0) {
      alert("No hay datos para exportar. Aplica un filtro de fechas primero.");
      return;
    }

    const dataToExport = sortedSales.map((sale) => ({
      "ID Operación": sale.id,
      "Tótem ID": sale.totem_id,
      "Tickets": (sale.ticket_numbers || []).join(" | "),
      "Monto (Gs)": sale.total_amount || 0,
      "Estado": sale.status,
      "Operación": sale.operation || "",
      "Proveedor": sale.provider || "",
      "Fecha": format(new Date(sale.timestamp_operacion), "dd/MM/yyyy", { locale: es }),
      "Hora": format(new Date(sale.timestamp_operacion), "HH:mm:ss"),
    }));

    const rangeLabel =
      filters.startDate && filters.endDate
        ? `_${filters.startDate}_al_${filters.endDate}`
        : `_${format(new Date(), "yyyyMMdd")}`;

    exportToCSV(dataToExport, `Reporte_Ventas${rangeLabel}`);
  };

  // Apply column sort client-side (preserves auto-refresh data)
  const sortedSales = [...sales].sort((a, b) => {
    if (!tableSort.field) return 0;
    const dir = tableSort.direction === "asc" ? 1 : -1;
    switch (tableSort.field) {
      case "total_amount":
        return ((a.total_amount || 0) - (b.total_amount || 0)) * dir;
      case "status":
        return (a.status || "").localeCompare(b.status || "") * dir;
      case "timestamp_operacion":
        return (
          (new Date(a.timestamp_operacion || 0).getTime() -
            new Date(b.timestamp_operacion || 0).getTime()) *
          dir
        );
      default:
        return 0;
    }
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-auto py-4 md:h-20 bg-white border-b border-slate-200 px-4 md:px-8 lg:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ShoppingCart className="text-slate-900" size={28} />
              Auditoría de Ventas
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Monitoreo y Control de Transacciones
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchSales()}
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
              title="Refrescar datos"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleExport}
              disabled={sortedSales.length === 0}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-40 disabled:cursor-not-allowed"
              title={sortedSales.length === 0 ? "No hay datos para exportar" : `Exportar ${sortedSales.length} registros como CSV`}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exportar Reporte</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 custom-scrollbar">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <KpiCard
              title="Monto Total"
              value={`$${(summary?.monto_total || 0).toLocaleString("es-CL")}`}
              subtitle="Ingresos brutos generados"
              icon={<TrendingUp size={24} />}
              color="bg-slate-900"
              textColor="text-white"
            />
            <KpiCard
              title="Ventas Totales"
              value={summary?.total_ventas || 0}
              subtitle="Transacciones procesadas"
              icon={<ShoppingCart size={24} />}
              color="bg-white"
              textColor="text-slate-900"
            />
            <KpiCard
              title="Exitosas"
              value={summary?.exitosas || 0}
              subtitle="Operaciones aprobadas"
              icon={<CheckCircle2 size={24} />}
              color="bg-emerald-500"
              textColor="text-white"
            />
            <KpiCard
              title="Fallidas"
              value={summary?.fallidas || 0}
              subtitle="Operaciones rechazadas"
              icon={<XCircle size={24} />}
              color="bg-red-500"
              textColor="text-white"
            />
          </div>

          {/* Filters Section */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-4 md:p-8 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-end gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Filter size={14} /> Filtros de búsqueda
                </h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha Inicio</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha Fin</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <button onClick={() => quickFilter("today")} className="flex-1 px-2 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-all">Hoy</button>
                  <button onClick={() => quickFilter("last7")} className="flex-1 px-2 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-all">7 Días</button>
                  <button onClick={() => quickFilter("last30")} className="flex-1 px-2 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-all">30 Días</button>
                </div>
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/10"
                >
                  <Search size={18} strokeWidth={3} />
                  Consultar Auditoría
                </button>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">
                Historial de Transacciones
                {sortedSales.length > 0 && (
                  <span className="ml-2 text-slate-400 font-medium normal-case text-xs tracking-normal">
                    ({sortedSales.length})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <Clock size={14} />
                {isRefreshing ? (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <RefreshCcw size={10} className="animate-spin" />
                    Actualizando...
                  </span>
                ) : lastRefreshed ? (
                  `Actualizado ${format(lastRefreshed, "HH:mm:ss")}`
                ) : (
                  "Actualizando..."
                )}
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Operación</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tótem</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tickets</th>
                    <SortableHeader
                      label="Monto"
                      field="total_amount"
                      current={tableSort.field}
                      direction={tableSort.direction}
                      onClick={toggleSort}
                    />
                    <SortableHeader
                      label="Estado"
                      field="status"
                      current={tableSort.field}
                      direction={tableSort.direction}
                      onClick={toggleSort}
                      className="text-center"
                    />
                    <SortableHeader
                      label="Fecha/Hora"
                      field="timestamp_operacion"
                      current={tableSort.field}
                      direction={tableSort.direction}
                      onClick={toggleSort}
                      className="text-right"
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-900 border-t-transparent mb-4"></div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando transacciones...</p>
                      </td>
                    </tr>
                  ) : sortedSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <ShoppingCart className="mx-auto text-slate-100 mb-4" size={48} />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron ventas en este rango</p>
                      </td>
                    </tr>
                  ) : (
                    sortedSales.map((sale) => (
                      <tr key={sale.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <Hash size={14} />
                            </div>
                            <span className="text-xs font-black text-slate-900">#{sale.id}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-bold text-slate-700">Tótem {sale.totem_id}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-1">
                            {sale.ticket_numbers.map((t, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-slate-900">
                            ${(sale.total_amount || 0).toLocaleString("es-CL")}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            {(() => {
                              const statusUpper = (sale.status || "").toUpperCase();
                              const badgeClass = statusUpper === "SUCCESS" || statusUpper === "APROBADA"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : statusUpper === "FAILED" || statusUpper === "RECHAZADA"
                                ? "bg-red-50 text-red-500 border-red-100"
                                : "bg-amber-50 text-amber-600 border-amber-100";
                              
                              return (
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${badgeClass}`}>
                                  {sale.status}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 leading-tight">
                              {format(new Date(sale.timestamp_operacion), "d MMM, yyyy", { locale: es })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {format(new Date(sale.timestamp_operacion), "HH:mm")} hrs
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon, color, textColor }: any) {
  return (
    <div className={`${color} rounded-[24px] p-5 shadow-md shadow-slate-200/50 transition-all hover:scale-[1.02] duration-300 group`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-xl ${color === "bg-white" ? "bg-slate-50 text-slate-900" : "bg-white/10 text-white"}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
        </div>
        <ArrowRight size={16} className={`${textColor} opacity-20 group-hover:opacity-100 transition-opacity`} />
      </div>
      <div>
        <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${color === "bg-white" ? "text-slate-400" : "text-white/60"}`}>
          {title}
        </h3>
        <p className={`text-xl font-black tracking-tighter ${textColor}`}>{value}</p>
        <p className={`text-[10px] font-medium mt-1 ${color === "bg-white" ? "text-slate-400" : "text-white/40"}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
