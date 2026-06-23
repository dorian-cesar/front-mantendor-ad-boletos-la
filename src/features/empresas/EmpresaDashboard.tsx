"use client";

import React, { useState } from "react";
import { Search, Plus, Edit, Trash2, Hash, Save, X, Film, Loader2, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpresas } from "./useEmpresas";
import { useVideos } from "../videos/useVideos";
import { EmpresaModal } from "./EmpresaModal";

export function EmpresaDashboard() {
  const {
    empresas,
    loading: loadingEmpresas,
    fetchEmpresas,
    handleUpdate,
    handleDelete
  } = useEmpresas();

  // Traer los videos para contar cuántos tiene cada empresa
  const { videos, loading: loadingVideos } = useVideos();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const filteredData = empresas.filter(item => {
    const matchesSearch = 
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalizar status para el filtro (algunos backends devuelven boolean)
    const currentStatus = (item.status === true || item.status === "Activo") ? "Activo" : "Inactivo";
    const matchesStatus = statusFilter === "Todos" || currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onEditClick = (comp: any) => {
    setEditingId(comp.id);
    setEditForm({ 
        ...comp,
        // Al editar asegurar que el select inicia con 'Activo' o 'Inactivo' y no true/false directamente
        status_ui: (comp.status === true || comp.status === "Activo") ? "Activo" : "Inactivo" 
    });
  };

  const onSaveEdit = async () => {
    if (!editForm) return;
    try {
      // Convertir 'status_ui' del cliente al 'status' original que espera el backend (probablemente boolean)
      const payload = {
        ...editForm,
        status: editForm.status_ui === "Activo" ? true : false,
      };
      
      await handleUpdate(editForm.id, payload);
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] dark:bg-zinc-950 text-slate-800 dark:text-slate-200 font-sans transition-colors">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 truncate">
            <span className="hidden sm:inline">Inicio</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium transition-colors truncate">Empresas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-300 px-3 py-1.5 rounded-full">ROL: SUPER_ADMIN</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative w-full">
          <EmpresaModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchEmpresas}
          />
          
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2 transition-colors">Empresas Registradas</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">Gestión de empresas colaboradoras, RUTs y contactos administrativos.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => fetchEmpresas()}
                disabled={loadingEmpresas}
                className="w-full sm:w-auto justify-center bg-slate-800 dark:bg-zinc-800 border border-transparent hover:bg-slate-700 dark:hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={loadingEmpresas ? "animate-spin" : ""} />
                Actualizar
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto bg-indigo-600 dark:bg-indigo-600 border border-transparent hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} strokeWidth={2.5} />
                Nueva Empresa
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-5 mb-6 transition-colors duration-300">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar empresa por nombre, RUT o dirección..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Estado:</span>
                <select 
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 cursor-pointer transition-colors outline-none"
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-emerald-900/20 text-slate-700 dark:text-emerald-400 border border-slate-200 dark:border-emerald-800/40 rounded-md text-sm font-medium transition-colors">
                <span>Operativas: {empresas.filter(e => e.status === true || e.status === "Activo").length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-red-900/20 text-slate-600 dark:text-red-400 border border-slate-200 dark:border-red-800/40 rounded-md text-sm font-medium transition-colors">
                <span>Inactivas: {empresas.filter(e => e.status === false || e.status === "Inactivo").length}</span>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-x-auto transition-colors duration-300">
            <table className="w-full min-w-[800px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-slate-500 transition-colors">
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest w-24">ID</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-28">Videos</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest">Nombre de la Empresa</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-40">Estado Actual</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-28">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loadingEmpresas ? (
                  <tr><td colSpan={6} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-slate-800 dark:text-white mb-2"/> Cargando empresas...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 dark:text-slate-500 font-medium">No se encontraron empresas.</td></tr>
                ) : filteredData.map((comp) => {
                  
                  const compVideos = videos.filter(v => String(v.empresa_id) === String(comp.id));

                  return (
                  <tr key={comp.id} className={`border-b border-slate-100 dark:border-zinc-800/60 transition-colors group ${editingId === comp.id ? 'bg-slate-50 dark:bg-zinc-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-zinc-800/30'}`}>
                    {editingId === comp.id ? (
                      <>
                        <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-black text-xs"><Hash size={10} className="inline mr-1 text-slate-400 dark:text-slate-500" /> {comp.id.toString().substring(0,6)}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-zinc-800 py-1 px-2 rounded-lg">
                            <Film size={12}/> {compVideos.length}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 outline-none transition-colors"
                            value={editForm.nombre || ""}
                            onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <select 
                            className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-100 rounded-lg text-[11px] font-bold uppercase cursor-pointer outline-none transition-colors"
                            value={editForm.status_ui}
                            onChange={(e) => setEditForm({...editForm, status_ui: e.target.value})}
                          >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={onSaveEdit}
                              className="p-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-all" 
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={onCancelEdit}
                              className="p-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-all" 
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-300 font-black text-xs">
                                <Hash size={10} className="text-slate-400 dark:text-slate-500" />
                                {comp.id.toString().substring(0,8)}
                            </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            {loadingVideos ? (
                              <Loader2 size={12} className="animate-spin text-slate-400 dark:text-slate-500" />
                            ) : (
                              <span className={`flex items-center justify-center gap-1 text-[11px] font-bold ${compVideos.length > 0 ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-zinc-800/50'} py-1 px-2.5 rounded-lg shadow-sm transition-colors`}>
                                <Film size={12}/> {compVideos.length} vids
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-black text-slate-800 dark:text-slate-200 text-[15px] group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase tracking-tight">{comp.nombre}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <StatusBadge status={(comp.status === true || comp.status === "Activo") ? 'Activo' : 'Inactivo'} />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Toggle de acceso rápido para estado */}
                            <button 
                              onClick={() => handleUpdate(comp.id, { 
                                ...comp, 
                                status: (comp.status === true || comp.status === "Activo") ? false : true 
                              })}
                              className={`w-8 h-[18px] rounded-full relative transition-colors opacity-0 group-hover:opacity-100 mr-2 flex-shrink-0 ${(comp.status === true || comp.status === "Activo") ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
                              title={(comp.status === true || comp.status === "Activo") ? "Desactivar" : "Activar"}
                            >
                              <div className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-all ${(comp.status === true || comp.status === "Activo") ? 'left-[18px]' : 'left-[2px]'}`} />
                            </button>

                            <button 
                              onClick={() => onEditClick(comp)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm rounded-xl transition-all" 
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(comp.id)}
                              className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm rounded-xl transition-all opacity-0 group-hover:opacity-100" 
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
