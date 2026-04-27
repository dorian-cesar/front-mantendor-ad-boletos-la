"use client";

import React, { useState } from "react";
import { Search, Plus, Edit, Trash2, Hash, Save, X, Film, Loader2 } from "lucide-react";
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
    <div className="flex h-screen w-full bg-[#f8f9fc] text-slate-800 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Inicio</span>
            <span>/</span>
            <span className="text-slate-800 font-medium transition-colors">Empresas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-900 px-3 py-1.5 rounded-full">ROL: SUPER_ADMIN</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <EmpresaModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchEmpresas}
          />
          
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800  tracking-tight mb-2 transition-colors">Empresas Registradas</h2>
              <p className="text-slate-500  text-sm transition-colors">Gestión de empresas colaboradoras, RUTs y contactos administrativos.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              Nueva Empresa
            </button>
          </div>

          <div className="bg-white  rounded-xl shadow-sm border border-slate-200  p-5 mb-6 transition-colors duration-300">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar empresa por nombre, RUT o dirección..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200  bg-white  rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Estado:</span>
                <select 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer transition-colors outline-none"
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
                <span>Operativas: {empresas.filter(e => e.status === true || e.status === "Activo").length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-sm font-medium">
                <span>Inactivas: {empresas.filter(e => e.status === false || e.status === "Inactivo").length}</span>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  overflow-hidden transition-colors duration-300">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50  border-b border-slate-200  text-slate-400 ">
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest w-24">ID</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-28">Videos</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest">Nombre de la Empresa</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-40">Estado Actual</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-28">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loadingEmpresas ? (
                  <tr><td colSpan={6} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-slate-800 mb-2"/> Cargando empresas...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No se encontraron empresas.</td></tr>
                ) : filteredData.map((comp) => {
                  
                  const compVideos = videos.filter(v => String(v.empresa_id) === String(comp.id));

                  return (
                  <tr key={comp.id} className={`border-b border-slate-100 transition-colors group ${editingId === comp.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                    {editingId === comp.id ? (
                      <>
                        <td className="py-4 px-6 text-slate-900 font-black text-xs"><Hash size={10} className="inline mr-1" /> {comp.id.toString().substring(0,6)}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 py-1 px-2 rounded-lg">
                            <Film size={12}/> {compVideos.length}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                            value={editForm.nombre || ""}
                            onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <select 
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold uppercase cursor-pointer outline-none"
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
                              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all" 
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={onCancelEdit}
                              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all" 
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs">
                                <Hash size={10} />
                                {comp.id.toString().substring(0,8)}
                            </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            {loadingVideos ? (
                              <Loader2 size={12} className="animate-spin text-slate-400" />
                            ) : (
                              <span className={`flex items-center justify-center gap-1 text-[11px] font-bold ${compVideos.length > 0 ? 'text-slate-900 bg-slate-100 border border-slate-200' : 'text-slate-400 bg-slate-100'} py-1 px-2.5 rounded-lg shadow-sm transition-colors`}>
                                <Film size={12}/> {compVideos.length} vids
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-black text-slate-800  text-[15px] group-hover:text-slate-900  transition-colors uppercase tracking-tight">{comp.nombre}</span>
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
                              className={`w-8 h-4 rounded-full relative transition-colors opacity-0 group-hover:opacity-100 mr-2 ${(comp.status === true || comp.status === "Activo") ? 'bg-slate-900' : 'bg-slate-300'}`}
                              title={(comp.status === true || comp.status === "Activo") ? "Desactivar" : "Activar"}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${(comp.status === true || comp.status === "Activo") ? 'left-4.5' : 'left-0.5'}`} />
                            </button>

                            <button 
                              onClick={() => onEditClick(comp)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-xl transition-all" 
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(comp.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all opacity-0 group-hover:opacity-100" 
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
