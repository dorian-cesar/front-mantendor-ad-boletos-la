"use client";

import React, { useState } from "react";
import { Search, Plus, Edit, Trash2, Hash, Save, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpresas } from "./useEmpresas";
import { EmpresaModal } from "./EmpresaModal";

export function EmpresaDashboard() {
  const {
    empresas,
    loading,
    fetchEmpresas,
    handleUpdate,
    handleDelete
  } = useEmpresas();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const filteredData = empresas.filter(item => {
    const matchesSearch = 
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.direccion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onEditClick = (comp: any) => {
    setEditingId(comp.id);
    setEditForm({ ...comp });
  };

  const onSaveEdit = async () => {
    if (!editForm) return;
    try {
      await handleUpdate(editForm.id, editForm);
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
            <span className="text-slate-800 font-medium">Empresas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full">ROL: SUPER_ADMIN</span>
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
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Empresas Registradas</h2>
              <p className="text-slate-500 text-sm">Gestión de empresas colaboradoras, RUTs y contactos administrativos.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              Nueva Empresa
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar empresa por nombre, RUT o dirección..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Estado:</span>
                <select 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Suspendidos</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-medium">
                <span>Operativas: {empresas.filter(e => e.status === "Activo").length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-sm font-medium">
                <span>Suspendidas: {empresas.filter(e => e.status === "Inactivo").length}</span>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400">
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest w-24">ID</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest">Nombre de la Empresa</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest hidden lg:table-cell">Detalles / RUT</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-40">Estado Actual</th>
                  <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-center w-28">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-500 mb-2"/> Cargando empresas...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No se encontraron empresas.</td></tr>
                ) : filteredData.map((comp) => (
                  <tr key={comp.id} className={`border-b border-slate-100 transition-colors group ${editingId === comp.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                    {editingId === comp.id ? (
                      <>
                        <td className="py-4 px-6 text-slate-400 font-bold text-xs"><Hash size={10} className="inline mr-1" /> {comp.id.toString().substring(0,6)}</td>
                        <td className="py-4 px-6">
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                          />
                        </td>
                        <td className="py-4 px-6 hidden lg:table-cell">
                          <div className="flex flex-col gap-2">
                            <input 
                              type="text" 
                              className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none"
                              value={editForm.rut}
                              placeholder="RUT"
                              onChange={(e) => setEditForm({...editForm, rut: e.target.value})}
                            />
                            <input 
                              type="text" 
                              className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium outline-none"
                              value={editForm.direccion}
                              placeholder="Dirección"
                              onChange={(e) => setEditForm({...editForm, direccion: e.target.value})}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <select 
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold uppercase cursor-pointer outline-none"
                            value={editForm.status}
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={onSaveEdit}
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all" 
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={onCancelEdit}
                              className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all" 
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                                <Hash size={10} />
                                {comp.id.toString().substring(0,8)}
                            </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-black text-slate-800 text-[15px] group-hover:text-blue-700 transition-colors">{comp.nombre}</span>
                        </td>
                        <td className="py-4 px-6 hidden lg:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">RUT: {comp.rut || 'N/A'}</span>
                            <span className="text-[11px] text-slate-500 font-medium line-clamp-1">{comp.direccion || 'Sin dirección'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <StatusBadge status={comp.status || 'Activo'} />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => onEditClick(comp)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all" 
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(comp.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm rounded-xl transition-all opacity-0 group-hover:opacity-100" 
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
