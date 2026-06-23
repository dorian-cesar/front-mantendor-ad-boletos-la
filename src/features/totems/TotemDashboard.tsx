"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Search, Plus, LayoutList, LayoutGrid, CheckCircle2, XCircle, AlertCircle, Video, BarChart3, Ticket, TrendingUp, RefreshCcw, ArrowRight, Wifi, WifiOff, Activity, AlertTriangle, Printer } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { useTotems } from "./useTotems";
import { useVideos } from "@/features/videos/useVideos";
import { useEmpresas } from "../empresas/useEmpresas";
import dynamic from "next/dynamic";
import { TotemList } from "./TotemList";
import { TotemGrid } from "./TotemGrid";

// Lazy Load de Modales para reducir el tamaño del bundle inicial (Performance Optimization)
const TotemModal = dynamic(() => import("./TotemModal").then(m => m.TotemModal), { ssr: false });
const CompanyVideoPickerModal = dynamic(() => import("./CompanyVideoPickerModal").then(m => m.CompanyVideoPickerModal), { ssr: false });
const TotemStatsModal = dynamic(() => import("./TotemStatsModal").then(m => m.TotemStatsModal), { ssr: false });
const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal").then(m => m.ConfirmModal), { ssr: false });
import { useToast } from "@/components/ui/Toast";

export function TotemDashboard() {
  const { showToast } = useToast();

  // Gestión del Picker Modal Simplificado
  const [pickerState, setPickerState] = useState<{ isOpen: boolean; totemId: string | null; selectedIds: string[] }>({
    isOpen: false,
    totemId: null,
    selectedIds: []
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    totems,
    resumenGlobal,
    loading,
    error: totemsError,
    isSaving,
    isPolling,
    fetchTotems,
    fetchPlaylist,
    handleSave,
    handleCreate,
    handleDelete,
    toggleBlockScreenSaver,
    toggleStatus,
    sendTotemCommand
  } = useTotems({
    onTotemConnect: (t) => showToast(`Tótem ${t.identificador || t.id} se ha conectado`, "success"),
    onTotemDisconnect: (t) => showToast(`Tótem ${t.identificador || t.id} se ha desconectado`, "error")
  });

  const { videos, loading: videosLoading, error: videosError, fetchVideos } = useVideos();
  const { empresas, loading: empresasLoading, error: empresasError, fetchEmpresas } = useEmpresas();

  // Exponer función de apertura de forma global
  React.useEffect(() => {
    (window as any).openVideoPicker = (id: string, currentIds: string[]) => {
      setPickerState({ isOpen: true, totemId: id, selectedIds: currentIds });
    };
  }, []);

  // Función consolidada para reintentar todo
  const refreshAll = () => {
    fetchTotems();
    fetchVideos();
    fetchEmpresas();
  };

  const hasAnyError = totemsError || videosError || empresasError;
  const anyErrorMessage = totemsError || videosError || empresasError;

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTotemId, setExpandedTotemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [kpiFilter, setKpiFilter] = useState<"all" | "activos" | "inactivos" | "online" | "offline">("all");

  // States for Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    identificador: "", 
    direccion: "", 
    latitud: 0,
    longitud: 0,
    status: "Activo", 
    video_ids: [] as string[], 
    empresa_ids: [] as string[]
  });

  // States for Create Mode
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    id: "",
    identificador: "", 
    direccion: "", 
    latitud: 0,
    longitud: 0,
    empresa_ids: [] as string[],
    video_ids: [] as string[]
  });

  // Estado para el modal de estadísticas (guardamos ID para mantener reactividad)
  const [statsTotemId, setStatsTotemId] = useState<string | null>(null);
  const statsTotem = useMemo(() => {
    if (!statsTotemId) return null;
    return totems.find(t => String(t.id) === String(statsTotemId)) || null;
  }, [totems, statsTotemId]);

  const filteredTotems = useMemo(() => {
    return totems.filter(t => {
      // Búsqueda por texto
      const matchesSearch = t.identificador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.direccion?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filtro por KPI
      if (kpiFilter === "all") return true;
      if (kpiFilter === "activos") return t.status === "Activo" || t.status === true;
      if (kpiFilter === "inactivos") return t.status !== "Activo" && t.status !== true;
      
      const getIsTotemSleepingFilter = (t: Totem) => {
        if (!t.is_online) return false;
        let telem;
        try {
          telem = typeof t.ultima_telemetria === 'string' ? JSON.parse(t.ultima_telemetria) : t.ultima_telemetria;
        } catch { return false; }
        return telem?.servicios_locales?.kiosk_app_responding === false;
      };

      if (kpiFilter === "online") return t.is_online === true && !getIsTotemSleepingFilter(t);
      if (kpiFilter === "reposo") return t.is_online === true && getIsTotemSleepingFilter(t);
      if (kpiFilter === "offline") return t.is_online !== true;

      return true;
    });
  }, [totems, searchTerm, kpiFilter]);

  // KPIs calculados
  const totemsActivos = totems.filter(t => t.status === "Activo" || t.status === true).length;
  const totemsInactivos = totems.length - totemsActivos;

  const getIsTotemSleeping = (t: Totem) => {
    if (!t.is_online) return false;
    let telem;
    try {
      telem = typeof t.ultima_telemetria === 'string' ? JSON.parse(t.ultima_telemetria) : t.ultima_telemetria;
    } catch { return false; }
    return telem?.servicios_locales?.kiosk_app_responding === false;
  };

  const totemsOnline = totems.filter(t => t.is_online && !getIsTotemSleeping(t)).length;
  const totemsEnReposo = totems.filter(t => t.is_online && getIsTotemSleeping(t)).length;
  const totemsOffline = totems.length - (totemsOnline + totemsEnReposo);

  // Alertas activas
  const offlineMoreThan20Mins = totems.filter(t => {
    if (t.is_online) return false;
    if (!t.last_ping) return true; // Offline y nunca se ha conectado
    const diff = new Date().getTime() - new Date(t.last_ping).getTime();
    return diff > 20 * 60 * 1000;
  });

  const printerErrors = totems.filter(t => {
    if (!t.ultima_telemetria) return false;
    let telem;
    try {
      telem = typeof t.ultima_telemetria === 'string' ? JSON.parse(t.ultima_telemetria) : t.ultima_telemetria;
    } catch { return false; }
    
    // Posibles estructuras de la telemetría para impresora
    if (telem?.printer?.status === 'error' || telem?.printer?.status === 'ERROR') return true;
    if (telem?.printer?.paper_out === true) return true;
    if (telem?.impresora?.estado === 'error' || telem?.impresora?.estado === 'ERROR') return true;
    if (telem?.impresora?.sin_papel === true) return true;
    
    return false;
  });

  const hasAlerts = offlineMoreThan20Mins.length > 0 || printerErrors.length > 0;

  // Videos exclusivos: excluir los que ya están asignados a OTROS tótems
  const availableVideos = useMemo(() => {
    if (!editingId) return videos;

    const takenByOthers = new Set<string>();
    totems.forEach((t) => {
      if (String(t.id) !== String(editingId)) {
        const ids = t.video_ids || t.videos?.map((v: any) => v.id) || [];
        ids.forEach((id: any) => takenByOthers.add(String(id)));
      }
    });

    // Mostrar videos no asignados + los ya asignados al tótem actual (usando strings para evitar fallos de tipo)
    return videos.filter(
      (v: any) => !takenByOthers.has(String(v.id)) || editForm.video_ids?.some(vid => String(vid) === String(v.id))
    );
  }, [videos, totems, editingId, editForm.video_ids]);

  const onEditClick = async (t: any) => {
    const backendEmpresaIds = t.empresa_ids?.map(String) || t.empresas?.map((e: any) => String(e.id)) || [];

    // Intentar obtener la playlist ordenada del servidor
    const playlist = await fetchPlaylist(String(t.id));
    
    let activeVideoIds: string[];
    if (playlist.length > 0) {
      // Ordenar por el campo 'orden' y extraer los IDs
      const sorted = [...playlist].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      activeVideoIds = sorted.map((p: any) => String(p.id || p.video_id));
    } else {
      activeVideoIds = t.video_ids?.map(String) || t.videos?.map((v: any) => String(v.id)) || [];
    }

    setEditingId(t.id);
    setEditForm({
      identificador: t.identificador || "",
      direccion: t.direccion || "",
      latitud: t.latitud || 0,
      longitud: t.longitud || 0,
      status: t.status || "Activo",
      video_ids: activeVideoIds,
      empresa_ids: backendEmpresaIds
    });
  };

  const onSaveEdit = async (id: string) => {
    try {
      const success = await handleSave(id, editForm);
      if (success) {
        setEditingId(null);
        showToast("Tótem actualizado correctamente", "success");
      }
    } catch (error: any) {
      showToast("Error al actualizar: " + (error.message || "Error desconocido"), "error");
    }
  };

  const onCreateNew = async () => {
    try {
      const success = await handleCreate(createForm);
      if (success) {
        setIsCreateModalOpen(false);
        setCreateForm({ id: "", identificador: "", direccion: "", latitud: 0, longitud: 0, empresa_ids: [], video_ids: [] });
        showToast("Tótem creado correctamente", "success");
      }
    } catch (error) {
      showToast("Error al crear el tótem", "error");
    }
  };

  const confirmDeleteTotem = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await handleDelete(deleteTarget);
      showToast("Tótem eliminado correctamente", "success");
    } catch {
      showToast("Error al eliminar el tótem", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, handleDelete, showToast]);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] dark:bg-zinc-950 text-slate-800 dark:text-slate-200 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 truncate">
            <span className="hidden sm:inline">Inicio</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">Tótems</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-200 px-3 py-1.5 rounded-full">
              ROL: SUPER_ADMIN
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative w-full">
          {/* Error Banner */}
          {hasAnyError && (
            <div className="mb-6 bg-slate-900 dark:bg-red-950/50 border border-slate-800 dark:border-red-900/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 shadow-xl shadow-slate-900/20">
               <div className="flex items-center gap-4 text-white dark:text-red-200">
                 <div className="bg-white/10 dark:bg-red-500/20 p-3 rounded-2xl text-white dark:text-red-400">
                    <AlertCircle size={28} />
                 </div>
                 <div>
                   <h4 className="font-bold text-base leading-tight">Interrupción del Servicio</h4>
                   <p className="text-xs text-slate-400 dark:text-red-300/80 mt-1 font-medium">
                     Se ha detectado un error técnico en el enlace con el backend. ({anyErrorMessage})
                   </p>
                 </div>
               </div>
               <button 
                 onClick={refreshAll}
                 className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-red-600 text-slate-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-red-500 transition-all shadow-sm flex items-center justify-center gap-2 transform active:scale-95"
               >
                 Reintentar Sincronización
               </button>
            </div>
          )}

          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Tótems de Venta</h2>
                {isPolling && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 animate-pulse shadow-sm">
                    <RefreshCcw size={10} className="animate-spin text-emerald-500 dark:text-emerald-400" />
                    <span>Sincronizando</span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Monitoreo en tiempo real de terminales físicos y métricas.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => fetchTotems()}
                disabled={loading}
                className="w-full sm:w-auto justify-center bg-slate-800 dark:bg-zinc-800 border border-transparent hover:bg-slate-700 dark:hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white border border-transparent px-5 py-2.5 rounded-xl font-semibold shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} strokeWidth={2.5} />
                Nuevo Tótem
              </button>
              <div className="w-full sm:w-auto flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "list"
                      ? "bg-slate-900 dark:bg-zinc-800 text-white shadow-md border border-slate-900/10 dark:border-zinc-700"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                    }`}
                >
                  <LayoutList size={18} />
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "grid"
                      ? "bg-slate-900 dark:bg-zinc-800 text-white shadow-md border border-slate-900/10 dark:border-zinc-700"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                    }`}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden sm:inline">Grilla</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
            <KpiCard
              title="Activos"
              value={totemsActivos}
              subtitle="Tótems habilitados"
              icon={<CheckCircle2 size={24} />}
              color="bg-emerald-500"
              textColor="text-white"
              isActive={kpiFilter === "activos"}
              onClick={() => setKpiFilter(prev => prev === "activos" ? "all" : "activos")}
            />
            <KpiCard
              title="Inactivos"
              value={totemsInactivos}
              subtitle="Tótems deshabilitados"
              icon={<XCircle size={24} />}
              color="bg-red-500"
              textColor="text-white"
              isActive={kpiFilter === "inactivos"}
              onClick={() => setKpiFilter(prev => prev === "inactivos" ? "all" : "inactivos")}
            />
            <KpiCard
              title="En línea (Activo)"
              value={totemsOnline}
              subtitle="Operando normalmente"
              icon={<Wifi size={24} />}
              color="bg-white"
              textColor="text-slate-900"
              isActive={kpiFilter === "online"}
              onClick={() => setKpiFilter(prev => prev === "online" ? "all" : "online")}
            />
            <KpiCard
              title="En Reposo"
              value={totemsEnReposo}
              subtitle="Sin actividad reciente"
              icon={<Wifi size={24} className="opacity-50" />}
              color="bg-amber-400"
              textColor="text-slate-900"
              isActive={kpiFilter === "reposo"}
              onClick={() => setKpiFilter(prev => prev === "reposo" ? "all" : "reposo")}
            />
            <KpiCard
              title="Fuera de línea"
              value={totemsOffline}
              subtitle="Pérdida de conexión"
              icon={<WifiOff size={24} />}
              color="bg-slate-900"
              textColor="text-white"
              isActive={kpiFilter === "offline"}
              onClick={() => setKpiFilter(prev => prev === "offline" ? "all" : "offline")}
            />
          </div>

          {/* Active Alerts */}
          {hasAlerts && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-[32px] p-6 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-black text-red-800 dark:text-red-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <AlertTriangle size={16} /> Alertas Críticas
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {offlineMoreThan20Mins.length > 0 && (
                  <div className="bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex gap-4">
                    <div className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-2.5 rounded-xl h-fit">
                      <WifiOff size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">Offline Prolongado</h4>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 mb-2 font-medium">Hay {offlineMoreThan20Mins.length} tótem(s) que llevan más de 20 minutos sin reportar actividad.</p>
                      <div className="flex flex-wrap gap-2">
                        {offlineMoreThan20Mins.slice(0, 5).map(t => (
                          <span key={t.id} className="text-[10px] font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                            {t.identificador || `ID: ${t.id}`}
                          </span>
                        ))}
                        {offlineMoreThan20Mins.length > 5 && (
                          <span className="text-[10px] font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                            +{offlineMoreThan20Mins.length - 5} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {printerErrors.length > 0 && (
                  <div className="bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex gap-4">
                    <div className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 p-2.5 rounded-xl h-fit">
                      <Printer size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">Problemas de Impresora</h4>
                      <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1 mb-2 font-medium">Hay {printerErrors.length} tótem(s) con fallas reportadas en la impresora o sin papel.</p>
                      <div className="flex flex-wrap gap-2">
                        {printerErrors.slice(0, 5).map(t => (
                          <span key={t.id} className="text-[10px] font-bold px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg border border-orange-200 dark:border-orange-800">
                            {t.identificador || `ID: ${t.id}`}
                          </span>
                        ))}
                        {printerErrors.length > 5 && (
                          <span className="text-[10px] font-bold px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg border border-orange-200 dark:border-orange-800">
                            +{printerErrors.length - 5} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resumen Global Cards */}
          {(resumenGlobal.total_transacciones > 0 || resumenGlobal.boletos_vendidos > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-zinc-800 text-white flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tótems</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totems.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 dark:bg-emerald-600/20 text-white dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Transacciones</span>
                </div>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{resumenGlobal.total_transacciones.toLocaleString("es-CL")}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 dark:bg-blue-600/20 text-white dark:text-blue-400 flex items-center justify-center">
                    <Ticket size={16} />
                  </div>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Boletos</span>
                </div>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{resumenGlobal.boletos_vendidos.toLocaleString("es-CL")}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                    <Video size={16} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Videos Activos</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{videos.filter(v => v.status === true).length}</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-5 mb-6 transition-colors duration-300">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar equipo..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-zinc-700 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800/50 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-zinc-800 rounded-md text-sm font-bold shadow-sm">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Tótems: {totems.length}</span>
              </div>
            </div>
          </div>

          {viewMode === "list" ? (
            <TotemList
              totems={filteredTotems}
              loading={loading}
              expandedId={expandedTotemId}
              toggleExpand={(id) => setExpandedTotemId(expandedTotemId === id ? null : id)}
              editingId={editingId}
              editForm={editForm}
              setEditForm={setEditForm}
              onEdit={onEditClick}
              onSave={onSaveEdit}
              onDelete={(id) => setDeleteTarget(id)}
              onToggleStatus={toggleStatus}
              onToggleBlockScreenSaver={toggleBlockScreenSaver}
              isSaving={isSaving}
              onCancelEdit={() => setEditingId(null)}
              allVideos={videos}
              availableVideos={availableVideos}
              empresas={empresas}
              onStats={(t: any) => setStatsTotemId(t.id)}
            />
          ) : (
            <TotemGrid
              totems={filteredTotems}
              loading={loading}
              editingId={editingId}
              editForm={editForm}
              setEditForm={setEditForm}
              onEdit={onEditClick}
              onSave={onSaveEdit}
              onDelete={(id) => setDeleteTarget(id)}
              onToggleStatus={toggleStatus}
              onToggleBlockScreenSaver={toggleBlockScreenSaver}
              isSaving={isSaving}
              onCancelEdit={() => setEditingId(null)}
              allVideos={videos}
              availableVideos={availableVideos}
              empresas={empresas}
              onStats={(t: any) => setStatsTotemId(t.id)}
            />
          )}
        </div>
      </main>

      <TotemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        form={createForm}
        setForm={setCreateForm}
        onSave={onCreateNew}
        isSaving={isSaving}
        videos={videos}
      />

      <CompanyVideoPickerModal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
        videos={videos}
        empresas={empresas}
        selectedVideoIds={pickerState.selectedIds}
        onAddVideos={(ids) => {
          // Actualizamos el formulario de edición con los nuevos videos
          const selectedVideos = videos.filter(v => ids.includes(String(v.id)));
          const uniqueEmpresaIds = Array.from(new Set(selectedVideos.map(v => String(v.empresa_id))));
          
          setEditForm(prev => ({
            ...prev,
            video_ids: ids,
            empresa_ids: uniqueEmpresaIds
          }));
          
          setPickerState(prev => ({ ...prev, isOpen: false }));
        }}
      />

      <TotemStatsModal
        isOpen={!!statsTotem}
        totem={statsTotem}
        isPolling={isPolling}
        onClose={() => setStatsTotemId(null)}
        onCommand={sendTotemCommand}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Eliminar tótem"
        message="¿Estás seguro de que deseas eliminar este tótem? Esta acción eliminará también la configuración de videos asociados."
        confirmLabel="Sí, eliminar"
        onConfirm={confirmDeleteTotem}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon, color, textColor, onClick, isActive }: any) {
  // Manejar el caso de las tarjetas "blancas" para el dark mode (por defecto son light)
  const isWhite = color === "bg-white";
  const bgClass = isWhite ? "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800" : color;
  const tColorClass = isWhite ? "text-slate-900 dark:text-white" : textColor;

  return (
    <div 
      onClick={onClick}
      className={`${bgClass} rounded-[24px] p-5 transition-all duration-300 group cursor-pointer
        ${isActive ? 'ring-4 ring-indigo-500/50 dark:ring-indigo-400/50 scale-[1.02] shadow-xl' : 'shadow-md shadow-slate-200/50 dark:shadow-none hover:scale-[1.02]'}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-xl transition-colors duration-300 ${isWhite ? "bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white" : "bg-white/10 text-white"} ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : ''}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
        </div>
        <ArrowRight size={16} className={`${tColorClass} opacity-20 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
      </div>
      <div>
        <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isWhite ? "text-slate-400 dark:text-slate-500" : "text-white/60"} ${isActive && isWhite ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          {title}
        </h3>
        <p className={`text-xl font-black tracking-tighter ${tColorClass} ${isActive && isWhite ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{value}</p>
        <p className={`text-[10px] font-medium mt-1 ${isWhite ? "text-slate-400 dark:text-slate-500" : "text-white/40"} ${isActive && isWhite ? 'text-indigo-500 dark:text-indigo-400/80' : ''}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
