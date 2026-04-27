"use client";

import React, { useState } from "react";
import { Search, Plus, XCircle, Loader2, Edit, Save, X } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useVideos } from "./useVideos";
import { useEmpresas } from "../empresas/useEmpresas";
import { UploadVideoModal } from "./UploadVideoModal";

export function VideoDashboard() {
  const {
    videos,
    loading,
    fetchVideos,
    handleUpdate,
    handleDelete,
    getVideoById
  } = useVideos();
  
  const { empresas } = useEmpresas();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [empresaFilter, setEmpresaFilter] = useState("Todas");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Estados para edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "", status: true });
  const [isSaving, setIsSaving] = useState(false);

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setInitialFile(selectedFile);
      setIsUploadModalOpen(true);
    }
  };

  const startEditing = async (vid: any) => {
    try {
      // Usar get para obtener la información más fresca desde el backend
      const freshVid = await getVideoById(vid.id);
      
      setEditingId(freshVid.id);
      setEditForm({
        nombre: freshVid.nombre || "",
        descripcion: freshVid.descripcion || "",
        status: freshVid.status === true
      });
    } catch (error) {
      // Fallback si el fetch individual falla
      setEditingId(vid.id);
      setEditForm({
        nombre: vid.nombre || "",
        descripcion: vid.descripcion || "",
        status: vid.status === true
      });
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      setIsSaving(true);
      await handleUpdate(id, editForm);
      setEditingId(null);
    } catch (error) {
      alert("Error al actualizar el video");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const currentStatus = v.status === true ? "Activo" : "Inactivo";
    const matchesStatus = statusFilter === "Todos" || currentStatus === statusFilter;
    const matchesEmpresa = empresaFilter === "Todas" || String(v.empresa_id) === String(empresaFilter);
    return matchesSearch && matchesStatus && matchesEmpresa;
  });

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Inicio</span>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-100 font-medium">Videos</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3 py-1.5 rounded-full">ROL: SUPER_ADMIN</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <UploadVideoModal 
            isOpen={isUploadModalOpen} 
            initialFile={initialFile}
            onClose={() => setIsUploadModalOpen(false)} 
            onSuccess={fetchVideos}
          />

          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="video/*"
            onChange={handleQuickUpload}
          />

          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">Videos Subidos</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Listado de videos gestionados y procesados por el backend.</p>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2 transform active:scale-95 border-2 border-slate-900"
              >
                <Plus size={18} strokeWidth={2.5} />
                Subir Video
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-6 transition-colors duration-300">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Empresa:</span>
                <select 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer outline-none"
                  value={empresaFilter}
                  onChange={(e) => setEmpresaFilter(e.target.value)}
                >
                  <option value="Todas">Todas las Empresas</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={String(emp.id)}>{emp.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Estado:</span>
                <select 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-sm font-medium">
                <span>Activos: {videos.filter(v => v.status === true).length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-sm font-medium">
                <span>Inactivos: {videos.filter(v => v.status === false).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-5 font-semibold w-24">ID</th>
                  <th className="py-3 px-5 font-semibold">TÍTULO</th>
                  <th className="py-3 px-5 font-semibold">DESCRIPCIÓN</th>
                  <th className="py-3 px-5 font-semibold w-40">FECHA DE SUBIDA</th>
                  <th className="py-3 px-5 font-semibold text-center w-40">ACCIONES / STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-slate-900 mb-2"/> Cargando videos...</td></tr>
                ) : filteredVideos.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No se encontraron videos.</td></tr>
                ) : filteredVideos.map((vid) => {
                  const isEditing = editingId === vid.id;

                  return (
                    <tr key={vid.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${isEditing ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>
                      <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">{vid.id?.toString().substring(0, 8)}</td>
                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-sm font-bold"
                          />
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-white">{vid.nombre}</span>
                            <a 
                              href={vid.url?.startsWith('http') ? vid.url : `/api/proxy${vid.url?.startsWith('/') ? '' : '/'}${vid.url}`} 
                              target="_blank" 
                              className="text-[10px] text-slate-900 hover:underline font-bold"
                            >
                              Ver video original
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <textarea 
                            value={editForm.descripcion}
                            onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-xs text-slate-500 min-h-[40px]"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{vid.descripcion || 'Sin descripción'}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">{new Date(vid.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => saveEdit(vid.id)}
                                disabled={isSaving}
                                className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                                title="Guardar cambios"
                              >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="mr-auto">
                                <StatusBadge status={vid.status === true ? 'Activo' : 'Inactivo'} />
                              </div>
                              <button 
                                onClick={() => startEditing(vid)}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Editar video"
                              >
                                <Edit size={16} />
                              </button>
                              
                              {/* Toggle rápido de status (checkbox simplificado) */}
                              <button 
                                onClick={() => handleUpdate(vid.id, { status: !vid.status })}
                                className={`w-8 h-4 rounded-full relative transition-colors ${vid.status ? 'bg-slate-900' : 'bg-slate-300'}`}
                                title={vid.status ? "Desactivar" : "Activar"}
                              >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${vid.status ? 'left-4.5' : 'left-0.5'}`} />
                              </button>

                              <button 
                                onClick={() => handleDelete(vid.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 ml-1"
                                title="Eliminar video"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
