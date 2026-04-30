"use client";

import React, { useState } from "react";
import { 
  Key, 
  Plus, 
  Search, 
  Shield, 
  TabletSmartphone, 
  MoreHorizontal, 
  Trash2, 
  Copy, 
  Check,
  Calendar,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
  Filter,
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
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
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
            
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/10"
            >
              <Plus size={18} strokeWidth={3} />
              Generar Nueva Key
            </button>
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
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm shrink-0">
              <button 
                onClick={() => setFilterType("ALL")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${filterType === "ALL" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Todas
              </button>
              <button 
                onClick={() => setFilterType("PLATAFORMA")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${filterType === "PLATAFORMA" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Plataforma
              </button>
              <button 
                onClick={() => setFilterType("TOTEM")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${filterType === "TOTEM" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Tótem
              </button>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredKeys.map((k) => (
                <div 
                  key={k.id}
                  className={`bg-white border-2 border-transparent hover:border-slate-900 rounded-[32px] p-6 transition-all shadow-sm group relative overflow-hidden ${!k.status ? 'opacity-60 grayscale' : ''}`}
                >
                  {/* Status Indicator */}
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-10 transition-colors ${k.tipo === 'PLATAFORMA' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  
                  <div className="flex items-start justify-between mb-8 relative">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${k.tipo === 'PLATAFORMA' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {k.tipo === 'PLATAFORMA' ? <Shield size={24} strokeWidth={2.5} /> : <TabletSmartphone size={24} strokeWidth={2.5} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">{k.description}</h3>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${k.tipo === 'PLATAFORMA' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {k.tipo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                          <Calendar size={12} />
                          {format(new Date(k.createdAt), "d MMM, yyyy", { locale: es })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button
                        onClick={() => handleToggleStatus(k.id, k.status)}
                        className={`p-2 rounded-xl transition-all ${k.status ? 'text-slate-900 bg-slate-50' : 'text-slate-300'}`}
                        title={k.status ? "Desactivar" : "Activar"}
                      >
                        {k.status ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                      <button 
                        onClick={() => handleOpenModal(k)}
                        className="p-2.5 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                        title="Editar"
                      >
                        <Pencil size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-2xl p-4 flex items-center justify-between border border-slate-100 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all duration-300">
                    <div className="flex flex-col overflow-hidden pr-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500">Valor de la Key</span>
                      <code className="text-sm font-black text-slate-900 font-mono truncate group-hover:text-white transition-colors">
                        {k.key}
                      </code>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(k.key, k.id)}
                      className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        copiedId === k.id 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-white text-slate-900 shadow-sm hover:scale-105 active:scale-95'
                      }`}
                    >
                      {copiedId === k.id ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                    </button>
                  </div>

                  {k.tipo === 'TOTEM' && k.totem && (
                    <div className="mt-6 flex items-center gap-3 px-1">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <TabletSmartphone size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Tótem Asociado</span>
                        <span className="text-xs font-bold text-slate-900 leading-none">
                          {k.totem.identificador} 
                          <span className="text-slate-400 font-medium ml-1.5">— {k.totem.direccion}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
