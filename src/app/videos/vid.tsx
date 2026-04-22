"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    LayoutDashboard,
    MonitorSmartphone,
    Edit,
    LogOut,
    Video,
    ChevronLeft,
    ChevronRight,
    Plus,
    TabletSmartphone,
    Building,
    Loader2
} from "lucide-react";
import UploadVideoModal from "@/components/UploadVideoModal";
import { apiFetch } from "@/lib/api";

export default function VideoDashboard() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // Resize Sidebar Logic
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isDragging, setIsDragging] = useState(false);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/videos");
            setVideos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este video?")) return;
        try {
            await apiFetch(`/videos/${id}`, { method: "DELETE" });
            fetchVideos();
        } catch (error) {
            alert("Error al eliminar: " + (error as Error).message);
        }
    };

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        // El API devuelve status: boolean (v.status === true)
        const currentStatus = v.status === true ? "Activo" : "Inactivo";
        const matchesStatus = statusFilter === "Todos" || currentStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeCount = videos.filter(v => v.status === true).length;
    const inactiveCount = videos.filter(v => v.status === false).length;
    const rejectedCount = 0; // El API actual no devuelve 'Falla' explícito

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

            {/* SIDEBAR (Menú lateral simulando el de tu imagen) */}
            <aside 
                style={{ width: `${sidebarWidth}px` }} 
                className={`relative bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 ${isDragging ? "transition-none select-none" : "transition-none"}`}
            >
                {/* Resizer Handle */}
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
                        <SidebarItem icon={<Building size={18} />} label="Empresa" />
                        <SidebarItem icon={<Video size={18} />} label="Videos" active />
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-200 overflow-hidden whitespace-nowrap w-full">
                    <button className="flex items-center gap-3 text-slate-500 hover:text-slate-800 transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-50">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT (Contenido Principal) */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* HEADER SUPERIOR */}
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

                {/* ÁREA DE TRABAJO */}
                <div className="flex-1 overflow-auto p-8 relative">
                    <UploadVideoModal 
                        isOpen={isUploadModalOpen} 
                        onClose={() => {
                            setIsUploadModalOpen(false);
                            fetchVideos();
                        }} 
                    />

                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Videos Subidos</h2>
                            <p className="text-slate-500 text-sm">Listado de videos gestionados y procesados por el backend del sistema.</p>
                        </div>
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 transform active:scale-95"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Subir Video
                        </button>
                    </div>

                    {/* BLOQUE DE FILTROS (Basado en la estructura de tu imagen) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">

                        {/* Buscador general */}
                        <div className="relative mb-5">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div>
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nombre..." 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600">Status:</span>
                                <select 
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-colors"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="Todos">Todos</option>
                                    <option value="Activo">Activos</option>
                                    <option value="Inactivo">Inactivos</option>
                                    <option value="Rechazado">Rechazados</option>
                                </select>
                            </div>
                        </div>

                        {/* Badges de métricas en la parte inferior de los filtros */}
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-medium">
                                <CheckCircle2 size={16} />
                                <span>Activos: {activeCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-sm font-medium">
                                <XCircle size={16} />
                                <span>Inactivos: {inactiveCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-sm font-medium">
                                <AlertCircle size={16} />
                                <span>Falla: {rejectedCount}</span>
                            </div>
                        </div>

                    </div>

                    {/* CONTROLES DE LA TABLA Y PAGINACIÓN */}
                    <div className="flex justify-between items-end mb-3 px-1">
                        <span className="text-sm text-slate-500 font-medium">681 resultados - Página 1 de 14</span>

                        <div className="flex gap-1">
                            <button className="p-1 px-2 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"><ChevronLeft size={18} /></button>
                            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded shadow-sm font-medium">1</button>
                            <button className="px-3 py-1 text-sm bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 shadow-sm transition-colors">2</button>
                            <button className="px-3 py-1 text-sm bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 shadow-sm transition-colors">3</button>
                            <span className="px-2 py-1 text-slate-400">...</span>
                            <button className="p-1 px-2 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    {/* DATOS DE LA TABLA */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                    <th className="py-3 px-5 font-semibold w-24">ID</th>
                                    <th className="py-3 px-5 font-semibold">TÍTULO</th>
                                    <th className="py-3 px-5 font-semibold">DESCRIPCIÓN</th>
                                    <th className="py-3 px-5 font-semibold w-40">FECHA DE SUBIDA</th>
                                    <th className="py-3 px-5 font-semibold w-32">TAMAÑO</th>
                                    <th className="py-3 px-5 font-semibold w-32 text-center">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-500 mb-2"/> Cargando videos...</td></tr>
                                ) : filteredVideos.length === 0 ? (
                                    <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-medium">No se encontraron videos.</td></tr>
                                ) : filteredVideos.map((vid) => (
                                    <tr key={vid.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">{vid.id?.toString()}</td>
                                        <td className="py-3.5 px-5 font-bold text-slate-800">
                                            <div className="flex flex-col">
                                                <span>{vid.nombre}</span>
                                                <a 
                                                    href={vid.url?.startsWith('http') ? vid.url : `https://backend-boletos-publicidad.dev-wit.com${vid.url}`} 
                                                    target="_blank" 
                                                    className="text-[10px] text-blue-500 hover:underline"
                                                >
                                                    Ver video original
                                                </a>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 text-slate-500 truncate max-w-[200px]">{vid.descripcion || 'Sin descripción'}</td>
                                        <td className="py-3.5 px-5 text-slate-500">{new Date(vid.createdAt || Date.now()).toLocaleDateString()}</td>
                                        <td className="py-3.5 px-5 text-slate-400 text-xs italic">N/A</td>
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center justify-between">
                                                <StatusBadge status={vid.status === true ? 'Activo' : 'Inactivo'} />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(vid.id); }}
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

// Componente helper para pintar etiquetas de estado consistentes
function StatusBadge({ status }: { status: string }) {
    if (status === "Activo") return <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-emerald-200">Activo</span>;
    if (status === "Inactivo") return <span className="bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-rose-200">Inactivo</span>;
    if (status === "Rechazado") return <span className="bg-orange-100/80 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-orange-200">Rechazado</span>;
    return null;
}

// Componente helper para items del Sidebar
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
