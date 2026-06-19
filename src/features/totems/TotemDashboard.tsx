"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Search, Plus, LayoutList, LayoutGrid, CheckCircle2, XCircle, AlertCircle, Video, BarChart3, Ticket, TrendingUp, RefreshCcw } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { useTotems } from "./useTotems";
import { useVideos } from "@/features/videos/useVideos";
import { useEmpresas } from "../empresas/useEmpresas";
import { TotemList } from "./TotemList";
import { TotemGrid } from "./TotemGrid";
import { TotemModal } from "./TotemModal";
import { CompanyVideoPickerModal } from "./CompanyVideoPickerModal";
import { TotemStatsModal } from "./TotemStatsModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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
    toggleStatus
  } = useTotems();

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

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

  const filteredTotems = totems.filter(t =>
    t.identificador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="flex h-screen w-full bg-[#f8f9fc] text-slate-800 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
            <span className="hidden sm:inline">Inicio</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-slate-800 font-medium truncate">Tótems</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-900 px-3 py-1.5 rounded-full">
              ROL: SUPER_ADMIN
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative w-full">
          {/* Error Banner */}
          {hasAnyError && (
            <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between animate-in slide-in-from-top-4 duration-300 shadow-xl shadow-slate-900/20">
               <div className="flex items-center gap-4 text-white">
                 <div className="bg-white/10 p-3 rounded-2xl text-white">
                    <AlertCircle size={28} />
                 </div>
                 <div>
                   <h4 className="font-bold text-base leading-tight">Interrupción del Servicio</h4>
                   <p className="text-xs text-slate-400 mt-1 font-medium">
                     Se ha detectado un error técnico en el enlace con el backend. ({anyErrorMessage})
                   </p>
                 </div>
               </div>
               <button 
                 onClick={refreshAll}
                 className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 transform active:scale-95"
               >
                 Reintentar Sincronización
               </button>
            </div>
          )}

          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tótems de Venta</h2>
                {isPolling && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-600 animate-pulse shadow-sm">
                    <RefreshCcw size={10} className="animate-spin text-emerald-500" />
                    <span>Sincronizando</span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm">Monitoreo en tiempo real de terminales físicos y métricas.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => fetchTotems()}
                disabled={loading}
                className="w-full sm:w-auto justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} strokeWidth={2.5} />
                Nuevo Tótem
              </button>
              <div className="w-full sm:w-auto flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "list"
                      ? "bg-slate-900 text-white shadow-md border border-slate-900/10"
                      : "text-slate-500 hover:text-slate-700 border border-transparent"
                    }`}
                >
                  <LayoutList size={18} />
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "grid"
                      ? "bg-slate-900 text-white shadow-md border border-slate-900/10"
                      : "text-slate-500 hover:text-slate-700 border border-transparent"
                    }`}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden sm:inline">Cuadros</span>
                </button>
              </div>
            </div>
          </div>

          {/* Resumen Global Cards */}
          {(resumenGlobal.total_transacciones > 0 || resumenGlobal.boletos_vendidos > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tótems</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{totems.length}</p>
              </div>
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Transacciones</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">{resumenGlobal.total_transacciones.toLocaleString("es-CL")}</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                    <Ticket size={16} />
                  </div>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Boletos</span>
                </div>
                <p className="text-2xl font-black text-blue-700">{resumenGlobal.boletos_vendidos.toLocaleString("es-CL")}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Video size={16} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Videos Activos</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{videos.filter(v => v.status === true).length}</p>
              </div>
            </div>
          )}

          <div className="bg-white  rounded-xl shadow-sm border border-slate-200  p-5 mb-6 transition-colors duration-300">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar equipo..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200  bg-white  rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900  transition-all shadow-sm "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50  text-slate-900  border border-slate-200  rounded-md text-sm font-bold shadow-sm">
                <CheckCircle2 size={16} />
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
