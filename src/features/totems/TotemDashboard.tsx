"use client";

import React, { useState } from "react";
import { Search, Plus, LayoutList, LayoutGrid, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/ui/Sidebar";
import { useTotems } from "./useTotems";
import { TotemList } from "./TotemList";
import { TotemGrid } from "./TotemGrid";
import { TotemModal } from "./TotemModal";

export function TotemDashboard() {
  const {
    totems,
    loading,
    isSaving,
    handleSave,
    handleCreate,
    handleDelete
  } = useTotems();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTotemId, setExpandedTotemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // States for Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ identificador: "", direccion: "", status: "Activo" });

  // States for Create Mode
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ identificador: "", direccion: "" });

  const filteredTotems = totems.filter(t => 
    t.identificador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onEditClick = (t: any) => {
    setEditingId(t.id);
    setEditForm({
      identificador: t.identificador || "",
      direccion: t.direccion || "",
      status: t.status || "Activo"
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
        setCreateForm({ identificador: "", direccion: "" });
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
            <span className="text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
              ROL: SUPER_ADMIN
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Tótems de Venta</h2>
              <p className="text-slate-500 text-sm">Monitoreo en tiempo real de terminales físicos y métricas.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <Plus size={18} strokeWidth={2.5} />
                Nuevo Tótem
              </button>
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === "list"
                      ? "bg-slate-50 text-blue-700 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-700 border border-transparent"
                  }`}
                >
                  <LayoutList size={18} />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === "grid"
                      ? "bg-slate-50 text-blue-700 shadow-sm border border-slate-200/60"
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
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-medium">
                <CheckCircle2 size={16} />
                <span>Activos: {totems.filter(t => t.status === "Activo").length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-sm font-medium">
                <XCircle size={16} />
                <span>Inactivos: {totems.filter(t => t.status === "Inactivo").length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-sm font-medium">
                <AlertCircle size={16} />
                <span>Error: {totems.filter(t => t.status === "Error").length}</span>
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
      />
    </div>
  );
}
