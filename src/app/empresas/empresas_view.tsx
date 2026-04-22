"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Edit,
    LogOut,
    Video,
    ChevronLeft,
    ChevronRight,
    Plus,
    TabletSmartphone,
    Building,
    Trash2,
    ExternalLink,
    Hash,
    X,
    Save
} from "lucide-react";
import EmpresaModal from "@/components/EmpresaModal";

import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EmpresaDashboard() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    const fetchEmpresas = async () => {
        setLoading(true);
        try {
            const result = await apiFetch("/empresas");
            setData(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Error fetching empresas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmpresas();
    }, []);
    
    const handleEditClick = (comp: any) => {
        setEditingId(comp.id);
        setEditForm({ ...comp });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const handleSave = async () => {
        if (!editForm) return;
        try {
            await apiFetch(`/empresas/${editForm.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    nombre: editForm.nombre,
                    rut: editForm.rut,
                    direccion: editForm.direccion,
                    status: editForm.status
                })
            });
            setEditingId(null);
            setEditForm(null);
            fetchEmpresas();
        } catch (error) {
            alert("Error al guardar: " + (error as Error).message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar esta empresa?")) return;
        try {
            await apiFetch(`/empresas/${id}`, { method: "DELETE" });
            fetchEmpresas();
        } catch (error) {
            alert("Error al eliminar: " + (error as Error).message);
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch = 
            item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.direccion?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeCount = data.filter(item => item.status === "Activo").length;
    const inactiveCount = data.filter(item => item.status === "Inactivo").length;
    
    // Resize Sidebar Logic
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            let newWidth = e.clientX;
            if (newWidth < 220) newWidth = 220;
            if (newWidth > 600) newWidth = 600;
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (isDragging) setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "none";
        } else {
            document.body.style.userSelect = "";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
        };
    }, [isDragging]);

    return (
        <div className="flex h-screen w-full bg-[#f8f9fc] text-slate-800 font-sans">

            {/* SIDEBAR */}
            <aside 
                style={{ width: `${sidebarWidth}px` }} 
                className={`relative bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 ${isDragging ? "transition-none select-none" : "transition-none"}`}
            >
                <div 
                    onMouseDown={() => setIsDragging(true)}
                    className="absolute top-0 -right-[3px] w-[6px] h-full cursor-col-resize z-20 group flex items-center justify-center"
                >
                    <div className={`w-[3px] h-full transition-colors ${isDragging ? 'bg-blue-500' : 'bg-transparent group-hover:bg-blue-300'}`} />
                </div>
                
                <div className="overflow-hidden whitespace-nowrap w-full">
                    <div className="h-16 flex items-center px-6 border-b border-slate-100 mb-6">
                        <span className="font-bold text-xl tracking-tight">Panel<span className="text-blue-500">Admin</span></span>
                    </div>

                    <nav className="px-4 space-y-1.5">
                        <SidebarItem icon={<TabletSmartphone size={18} />} label="Totem" />
                        <SidebarItem icon={<Building size={18} />} label="Empresa" active />
                        <SidebarItem icon={<Video size={18} />} label="Videos" />
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-200 overflow-hidden whitespace-nowrap w-full">
                    <button className="flex items-center gap-3 text-slate-500 hover:text-slate-800 transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-50">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* HEADER SUPERIOR */}
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
                        onClose={() => {
                            setIsModalOpen(false);
                            fetchEmpresas();
                        }} 
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

                    {/* BLOQUE DE FILTROS */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">

                        <div className="relative mb-5">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar empresa por nombre, RUT o dirección..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                            <div>
                                <input type="text" placeholder="Filtrar por RUT" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <input type="text" placeholder="Filtrar por Ciudad" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600">Estado:</span>
                                <select 
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-colors"
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
                                <CheckCircle2 size={16} />
                                <span>Operativas: {activeCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-sm font-medium">
                                <XCircle size={16} />
                                <span>Suspendidas: {inactiveCount}</span>
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-between items-end mb-3 px-1">
                        <span className="text-sm text-slate-500 font-medium">{filteredData.length} empresas encontradas</span>

                        <div className="flex gap-1">
                            <button className="p-1 px-2 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"><ChevronLeft size={18} /></button>
                            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded shadow-sm font-medium">1</button>
                            <button className="px-3 py-1 text-sm bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 shadow-sm transition-colors">2</button>
                            <button className="px-3 py-1 text-sm bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 shadow-sm transition-colors">3</button>
                            <span className="px-2 py-1 text-slate-400">...</span>
                            <button className="p-1 px-2 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    {/* TABLA DE EMPRESAS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400">
                                    <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest w-24">ID <span className="text-[8px] font-bold text-blue-400 ml-1">(AUTO)</span></th>
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
                                                            onClick={handleSave}
                                                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all" 
                                                            title="Guardar"
                                                        >
                                                            <Save size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={handleCancel}
                                                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all" 
                                                            title="Cancelar"
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
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-[15px] group-hover:text-blue-700 transition-colors">{comp.nombre}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter lg:hidden">{comp.rut}</span>
                                                    </div>
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
                                                            onClick={() => handleEditClick(comp)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all" 
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(comp.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm rounded-xl transition-all opacity-0 group-hover:opacity-100" 
                                                            title="Eliminar"
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

function StatusBadge({ status }: { status: string }) {
    if (status === "Activo") return <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-emerald-200 uppercase">Activo</span>;
    if (status === "Inactivo") return <span className="bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-rose-200 uppercase">Suspendida</span>;
    return null;
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <a
            href={label === "Videos" ? "/videos" : label === "Totem" ? "/totems" : label === "Empresa" ? "/empresas" : "#"}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
        >
            {React.cloneElement(icon as React.ReactElement, {
                className: active ? "text-blue-600" : "text-slate-400"
            })}
            {label}
        </a>
    );
}
