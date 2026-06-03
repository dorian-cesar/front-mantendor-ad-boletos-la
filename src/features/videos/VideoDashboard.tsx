"use client";

import React, { useState, useCallback } from "react";
import {
  Search, Plus, XCircle, Loader2, Edit, Save, X,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown
} from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useVideos } from "./useVideos";
import { useEmpresas } from "../empresas/useEmpresas";
import { UploadVideoModal } from "./UploadVideoModal";
import { useUpload } from "./UploadContext";
import { useToast } from "@/components/ui/Toast";

// ─── Types ────────────────────────────────────────────────────
type SortField = "peso" | "resolucion" | "extension" | "createdAt" | null;
type SortDir = "asc" | "desc";

// ─── Sortable Column Header ────────────────────────────────────
function SortableHeader({
  label, field, current, direction, onClick
}: {
  label: string;
  field: SortField;
  current: SortField;
  direction: SortDir;
  onClick: (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <th
      className="py-3 px-4 font-semibold cursor-pointer select-none group whitespace-nowrap"
      onClick={() => onClick(field)}
    >
      <span className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors">
        {label}
        {active ? (
          direction === "asc"
            ? <ArrowUp size={13} className="text-slate-900" />
            : <ArrowDown size={13} className="text-slate-900" />
        ) : (
          <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        )}
      </span>
    </th>
  );
}

// ─── Component ────────────────────────────────────────────────
export function VideoDashboard() {
  const { openModal } = useUpload();
  const { showToast } = useToast();
  const {
    videos,
    loading,
    fetchVideos,
    handleUpdate,
    handleDelete,
    getVideoById
  } = useVideos();

  const { empresas } = useEmpresas();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [empresaFilter, setEmpresaFilter] = useState("Todas");

  // File upload
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "", status: true });
  const [isSaving, setIsSaving] = useState(false);

  // Column sort
  const [tableSort, setTableSort] = useState<{ field: SortField; direction: SortDir }>({
    field: null,
    direction: "asc",
  });

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Handlers ────────────────────────────────────────────────
  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setInitialFile(selectedFile);
      openModal();
    }
  };

  const startEditing = async (vid: any) => {
    try {
      const freshVid = await getVideoById(vid.id);
      setEditingId(freshVid.id);
      setEditForm({
        nombre: freshVid.nombre ?? "",
        descripcion: freshVid.descripcion ?? "",
        status: freshVid.status === true,
      });
    } catch {
      // Fallback to local data if fetch fails
      setEditingId(vid.id);
      setEditForm({
        nombre: vid.nombre ?? "",
        descripcion: vid.descripcion ?? "",
        status: vid.status === true,
      });
    }
  };

  const cancelEditing = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    try {
      setIsSaving(true);
      await handleUpdate(id, editForm);
      setEditingId(null);
      showToast("Video actualizado correctamente", "success");
    } catch {
      showToast("Error al actualizar el video", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await handleDelete(deleteTarget);
      showToast("Video eliminado correctamente", "success");
    } catch {
      showToast("Error al eliminar el video", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, handleDelete, showToast]);

  const toggleTableSort = (field: SortField) => {
    setTableSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // ─── Filtered + Sorted videos ────────────────────────────────
  const filteredVideos = videos
    .filter((v) => {
      const matchesSearch = v.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const currentStatus = v.status === true ? "Activo" : "Inactivo";
      const matchesStatus = statusFilter === "Todos" || currentStatus === statusFilter;
      const matchesEmpresa = empresaFilter === "Todas" || String(v.empresa_id) === String(empresaFilter);
      return matchesSearch && matchesStatus && matchesEmpresa;
    })
    .sort((a, b) => {
      // Primary: table column sort (click on headers)
      if (tableSort.field) {
        const dir = tableSort.direction === "asc" ? 1 : -1;
        switch (tableSort.field) {
          case "peso":
            return ((a.peso || 0) - (b.peso || 0)) * dir;
          case "resolucion":
            return ((a.resolucion || "") > (b.resolucion || "") ? 1 : -1) * dir;
          case "extension":
            return ((a.extension || "") > (b.extension || "") ? 1 : -1) * dir;
          case "createdAt":
            return (
              (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dir
            );
        }
      }
      // Default: newest first
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] text-slate-800 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 sm:h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-slate-500 truncate">
            <span className="hidden sm:inline">Inicio</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-slate-800 font-medium truncate">Videos</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
              ROL: SUPER_ADMIN
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative w-full">
          <UploadVideoModal
            initialFile={initialFile}
            onSuccess={fetchVideos}
          />

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,video/*"
            onChange={handleQuickUpload}
          />

          {/* Page title + CTA */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">Videos Subidos</h2>
              <p className="text-slate-500 text-sm">Listado de videos gestionados y procesados por el backend.</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto justify-center bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              Subir Video
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 mb-5">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Empresa:</span>
                <div className="relative flex-1">
                  <select
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                    value={empresaFilter}
                    onChange={(e) => setEmpresaFilter(e.target.value)}
                  >
                    <option value="Todas">Todas las Empresas</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>{emp.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Estado:</span>
                <div className="relative flex-1">
                  <select
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Activo">Activos</option>
                    <option value="Inactivo">Inactivos</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Activos: {videos.filter((v) => v.status === true).length}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Inactivos: {videos.filter((v) => v.status === false).length}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-md font-semibold">
                Total: {filteredVideos.length}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="py-3 px-4 font-semibold w-16">ID</th>
                  <th className="py-3 px-4 font-semibold">TÍTULO</th>
                  <th className="py-3 px-4 font-semibold hidden lg:table-cell">DESCRIPCIÓN</th>
                  <SortableHeader
                    label="TAMAÑO"
                    field="peso"
                    current={tableSort.field}
                    direction={tableSort.direction}
                    onClick={toggleTableSort}
                  />
                  <SortableHeader
                    label="RESOLUCIÓN"
                    field="resolucion"
                    current={tableSort.field}
                    direction={tableSort.direction}
                    onClick={toggleTableSort}
                  />
                  <SortableHeader
                    label="EXT."
                    field="extension"
                    current={tableSort.field}
                    direction={tableSort.direction}
                    onClick={toggleTableSort}
                  />
                  <SortableHeader
                    label="FECHA SUBIDA"
                    field="createdAt"
                    current={tableSort.field}
                    direction={tableSort.direction}
                    onClick={toggleTableSort}
                  />
                  <th className="py-3 px-4 font-semibold text-center w-44">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Loader2 size={28} className="animate-spin mx-auto text-slate-900 mb-2" />
                      <span className="text-slate-400 text-sm">Cargando videos...</span>
                    </td>
                  </tr>
                ) : filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-400 text-sm font-medium">
                      No se encontraron videos.
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map((vid) => {
                    const isEditing = editingId === vid.id;

                    return (
                      <tr
                        key={vid.id}
                        className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors group ${isEditing ? "bg-slate-50" : ""}`}
                      >
                        {/* ID */}
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          #{vid.id?.toString().substring(0, 6)}
                        </td>

                        {/* Título */}
                        <td className="py-3 px-4 max-w-[180px]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.nombre}
                              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 text-sm font-semibold"
                            />
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800 truncate">{vid.nombre}</span>
                              <a
                                href={vid.url?.startsWith("http") ? vid.url : `/api/proxy${vid.url?.startsWith("/") ? "" : "/"}${vid.url}`}
                                target="_blank"
                                className="text-[10px] text-blue-600 hover:underline font-medium"
                              >
                                Ver video ↗
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Descripción */}
                        <td className="py-3 px-4 hidden lg:table-cell max-w-[200px]">
                          {isEditing ? (
                            <textarea
                              value={editForm.descripcion}
                              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 text-xs text-slate-500 min-h-[36px] resize-none"
                              placeholder="Sin descripción"
                            />
                          ) : (
                            <p className="text-slate-400 text-xs truncate">
                              {(vid.descripcion ?? "").trim() || "Sin descripción"}
                            </p>
                          )}
                        </td>

                        {/* Tamaño */}
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                          {vid.peso
                            ? (vid.peso / (1024 * 1024)).toFixed(2) + " MB"
                            : vid.tamano
                            ? typeof vid.tamano === "number"
                              ? (vid.tamano / (1024 * 1024)).toFixed(2) + " MB"
                              : vid.tamano
                            : "N/A"}
                        </td>

                        {/* Resolución */}
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                          {vid.resolucion || vid.resolution || "—"}
                        </td>

                        {/* Extensión */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {vid.extension ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono uppercase border border-slate-200">
                              {vid.extension}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(vid.createdAt || Date.now()).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isEditing ? (
                              <>
                                {/* Status toggle in edit mode */}
                                <select
                                  value={editForm.status ? "true" : "false"}
                                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value === "true" })}
                                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                                >
                                  <option value="true">Activo</option>
                                  <option value="false">Inactivo</option>
                                </select>
                                <button
                                  onClick={() => saveEdit(vid.id)}
                                  disabled={isSaving}
                                  className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                  title="Guardar"
                                >
                                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                  title="Cancelar"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="mr-1">
                                  <StatusBadge status={vid.status === true ? "Activo" : "Inactivo"} />
                                </div>

                                {/* Quick toggle */}
                                <button
                                  onClick={() => handleUpdate(vid.id, { status: !vid.status })}
                                  className={`w-8 h-[18px] rounded-full relative transition-colors flex-shrink-0 ${vid.status ? "bg-emerald-500" : "bg-slate-300"}`}
                                  title={vid.status ? "Desactivar" : "Activar"}
                                >
                                  <div
                                    className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-all ${vid.status ? "left-[18px]" : "left-[2px]"}`}
                                  />
                                </button>

                                <button
                                  onClick={() => startEditing(vid)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                                  title="Editar"
                                >
                                  <Edit size={14} />
                                </button>

                                <button
                                  onClick={() => setDeleteTarget(vid.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                                  title="Eliminar"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Eliminar video"
        message="¿Estás seguro de que deseas eliminar este video? Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
