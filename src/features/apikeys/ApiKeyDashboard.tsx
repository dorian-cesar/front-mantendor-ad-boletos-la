"use client";

import React, { useState } from "react";
import {
  Key,
  Plus,
  Search,
  Shield,
  TabletSmartphone,
  Trash2,
  Copy,
  Check,
  Calendar,
  RefreshCcw,
  Pencil
} from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { useApiKeys } from "./useApiKeys";
import { useTotems } from "@/features/totems/useTotems";
import { ApiKeyModal } from "./ApiKeyModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ApiKeyDashboard() {
  const { apiKeys, loading, error, isSaving, fetchApiKeys, handleCreateKey, handleUpdateKey, handleDeleteKey } = useApiKeys();
  const { totems } = useTotems();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");

  const handleOpenModal = (key: any = null) => {
    setEditingKey(key);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingKey(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (form: any) => {
    if (editingKey) {
      return await handleUpdateKey(editingKey.id, form);
    } else {
      return await handleCreateKey(form);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredKeys = apiKeys.filter(k => {
    const matchesSearch =
      k.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.totem?.identificador?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "ALL" || k.tipo === filterType;

    return matchesSearch && matchesType;
  });

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    await handleUpdateKey(id, { status: !currentStatus });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header Section */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                <Key size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">API Keys</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Gestión de Credenciales de Acceso
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  {apiKeys.length} llaves registradas
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => fetchApiKeys()}
                disabled={loading}
                className="w-full sm:w-auto justify-center flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-sm whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} strokeWidth={2.5} />
                Actualizar
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="w-full md:w-auto justify-center flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/10 whitespace-nowrap"
              >
                <Plus size={18} strokeWidth={3} />
                Generar Nueva Key
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Buscar por descripción, valor de key o tótem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all shadow-sm"
              />
            </div>

            <div className="flex w-full md:w-auto items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm shrink-0 overflow-x-auto">
              <button
                onClick={() => setFilterType("ALL")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${filterType === "ALL" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterType("PLATAFORMA")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${filterType === "PLATAFORMA" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Plataforma
              </button>
              <button
                onClick={() => setFilterType("TOTEM")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${filterType === "TOTEM" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Tótem
              </button>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-200 w-full">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Cargando credenciales...</p>
            </div>
          ) : error ? (
            <div className="bg-white border-2 border-red-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RefreshCcw size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Error al cargar datos</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">{error}</p>
              <button
                onClick={fetchApiKeys}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
              >
                Reintentar
              </button>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center">
              <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                <Key size={48} strokeWidth={1} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No se encontraron API Keys</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium leading-relaxed">
                {searchTerm ? 'No hay resultados para tu búsqueda. Intenta con otros términos.' : 'Comienza generando tu primera llave de acceso para tótems o plataforma.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden transition-all">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción / Nombre</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor de la Key</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asociación</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredKeys.map((k) => (
                      <tr
                        key={k.id}
                        className={`group hover:bg-slate-50/80 transition-all duration-200 ${!k.status ? 'opacity-50 grayscale-[0.5]' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${k.tipo === 'PLATAFORMA' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {k.tipo === 'PLATAFORMA' ? <Shield size={18} /> : <TabletSmartphone size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">{k.description}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                Creada: {format(new Date(k.createdAt), "d MMM, yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-tighter ${k.tipo === 'PLATAFORMA'
                              ? 'bg-blue-100/50 text-blue-700'
                              : 'bg-emerald-100/50 text-emerald-700'
                            }`}>
                            {k.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 max-w-[120px] truncate">
                              {k.key}
                            </code>
                            <button
                              onClick={() => copyToClipboard(k.key, k.id)}
                              className={`p-1.5 rounded-lg transition-all ${copiedId === k.id
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110'
                                  : 'text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm active:scale-95'
                                }`}
                            >
                              {copiedId === k.id ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {k.tipo === 'TOTEM' && k.totem ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800 leading-tight">{k.totem.identificador}</span>
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{k.totem.direccion}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-300 italic">Global / Admin</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleStatus(k.id, k.status)}
                              className={`w-8 h-[18px] rounded-full relative transition-colors flex-shrink-0 ${k.status ? "bg-emerald-500" : "bg-slate-300"}`}
                              title={k.status ? "Desactivar" : "Activar"}
                            >
                              <div
                                className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-all ${k.status ? "left-[18px]" : "left-[2px]"}`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenModal(k)}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteKey(k.id)}
                              className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        totems={totems}
        isSaving={isSaving}
        initialData={editingKey}
      />
    </div>
  );
}
