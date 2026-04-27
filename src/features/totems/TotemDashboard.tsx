"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, LayoutList, LayoutGrid, CheckCircle2, XCircle, AlertCircle, Video } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { useTotems } from "./useTotems";
import { useVideos } from "@/features/videos/useVideos";
import { useEmpresas } from "@/features/empresas/useEmpresas";
import { TotemList } from "./TotemList";
import { TotemGrid } from "./TotemGrid";
import { TotemModal } from "./TotemModal";
import { CompanyVideoPickerModal } from "./CompanyVideoPickerModal";

export function TotemDashboard() {
  // Gestión del Picker Modal Simplificado
  const [pickerState, setPickerState] = useState<{ isOpen: boolean; totemId: string | null; selectedIds: string[] }>({
    isOpen: false,
    totemId: null,
    selectedIds: []
  });

  const {
    totems,
    loading,
    error: totemsError,
    isSaving,
    fetchTotems,
    handleSave,
    handleCreate,
    handleDelete
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
    identificador: "", 
    direccion: "", 
    empresa_ids: [] as string[],
    video_ids: [] as string[]
  });

  const filteredTotems = totems.filter(t =>
    t.identificador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Videos exclusivos: excluir los que ya están asignados a OTROS tótems
  const availableVideos = useMemo(() => {
    if (!editingId) return videos;

    const takenByOthers = new Set<string>();
    totems.forEach((t) => {
      if (t.id !== editingId) {
        const ids = t.video_ids || t.videos?.map((v: any) => v.id) || [];
        ids.forEach((id: string) => takenByOthers.add(id));
      }
    });

    // Mostrar videos no asignados + los ya asignados al tótem actual
    return videos.filter(
      (v: any) => !takenByOthers.has(v.id) || editForm.video_ids?.includes(v.id)
    );
  }, [videos, totems, editingId, editForm.video_ids]);

  const onEditClick = (t: any) => {
    const activeVideoIds = t.video_ids?.map(String) || t.videos?.map((v: any) => String(v.id)) || [];
    const backendEmpresaIds = t.empresa_ids?.map(String) || t.empresas?.map((e: any) => String(e.id)) || [];

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
      if (success) setEditingId(null);
    } catch (error) {
      alert("Error al actualizar");
    }
  };

  const onCreateNew = async () => {
    try {
      const success = await handleCreate(createForm);
      if (success) {
        setIsCreateModalOpen(false);
        setCreateForm({ identificador: "", direccion: "", empresa_ids: [], video_ids: [] });
      }
    } catch (error) {
      alert("Error al crear");
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] text-slate-800 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Inicio</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Tótems</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-900 px-3 py-1.5 rounded-full">
              ROL: SUPER_ADMIN
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
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
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Tótems de Venta</h2>
              <p className="text-slate-500 text-sm">Monitoreo en tiempo real de terminales físicos y métricas.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <Plus size={18} strokeWidth={2.5} />
                Nuevo Tótem
              </button>
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "list"
                      ? "bg-slate-900 text-white shadow-md border border-slate-900/10"
                      : "text-slate-500 hover:text-slate-700 border border-transparent"
                    }`}
                >
                  <LayoutList size={18} />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "grid"
                      ? "bg-slate-900 text-white shadow-md border border-slate-900/10"
                      : "text-slate-500 hover:text-slate-700 border border-transparent"
                    }`}
                >
                  <LayoutGrid size={18} />
                  Cuadros
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar equipo..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-md text-sm font-bold shadow-sm">
                <CheckCircle2 size={16} />
                <span>Tótems: {totems.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white border border-slate-900 rounded-md text-sm font-bold shadow-sm transition-all hover:bg-black">
                <Video size={16} className="text-white" />
                <span>Videos Activos: {videos.filter(v => v.status === true).length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-md text-sm font-medium">
                <XCircle size={16} className="text-slate-400" />
                <span>Videos Inactivos: {videos.filter(v => v.status === false).length}</span>
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
              onDelete={handleDelete}
              isSaving={isSaving}
              onCancelEdit={() => setEditingId(null)}
              allVideos={videos}
              availableVideos={availableVideos}
              empresas={empresas}
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
              onDelete={handleDelete}
              isSaving={isSaving}
              onCancelEdit={() => setEditingId(null)}
              allVideos={videos}
              availableVideos={availableVideos}
              empresas={empresas}
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
    </div>
  );
}
