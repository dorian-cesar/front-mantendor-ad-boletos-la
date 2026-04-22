"use client";

import React, { useState } from "react";
import { Search, Plus, XCircle, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useVideos } from "./useVideos";
import { UploadVideoModal } from "./UploadVideoModal";

export function VideoDashboard() {
  const {
    videos,
    loading,
    fetchVideos,
    handleDelete
  } = useVideos();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const currentStatus = v.status === true ? "Activo" : "Inactivo";
    const matchesStatus = statusFilter === "Todos" || currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] text-slate-800 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Inicio</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Videos</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full">ROL: SUPER_ADMIN</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <UploadVideoModal 
            isOpen={isUploadModalOpen} 
            onClose={() => setIsUploadModalOpen(false)} 
            onSuccess={fetchVideos}
          />

          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Videos Subidos</h2>
              <p className="text-slate-500 text-sm">Listado de videos gestionados y procesados por el backend.</p>
            </div>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              Subir Video
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-medium">
                <span>Activos: {videos.filter(v => v.status === true).length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-sm font-medium">
                <span>Inactivos: {videos.filter(v => v.status === false).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-5 font-semibold w-24">ID</th>
                  <th className="py-3 px-5 font-semibold">TÍTULO</th>
                  <th className="py-3 px-5 font-semibold">DESCRIPCIÓN</th>
                  <th className="py-3 px-5 font-semibold w-40">FECHA DE SUBIDA</th>
                  <th className="py-3 px-5 font-semibold text-center w-32">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-500 mb-2"/> Cargando videos...</td></tr>
                ) : filteredVideos.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No se encontraron videos.</td></tr>
                ) : filteredVideos.map((vid) => (
                  <tr key={vid.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">{vid.id?.toString().substring(0, 8)}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      <div className="flex flex-col">
                        <span>{vid.nombre}</span>
                        <a 
                          href={vid.url?.startsWith('http') ? vid.url : `/api/proxy${vid.url?.startsWith('/') ? '' : '/'}${vid.url}`} 
                          target="_blank" 
                          className="text-[10px] text-blue-500 hover:underline"
                        >
                          Ver video original
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 truncate max-w-[200px]">{vid.descripcion || 'Sin descripción'}</td>
                    <td className="py-3.5 px-5 text-slate-500">{new Date(vid.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={vid.status === true ? 'Activo' : 'Inactivo'} />
                        <button 
                          onClick={() => handleDelete(vid.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
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
