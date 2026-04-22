"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Building,
    MonitorSmartphone,
    Edit,
    LogOut,
    Video,
    TabletSmartphone,
    DollarSign,
    Ticket as TicketIcon,
    Terminal,
    ChevronDown,
    ChevronUp,
    LayoutList,
    LayoutGrid,
    Save,
    X,
    Plus,
    Trash2,
    Loader2,
    RefreshCw,
    Hash
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// Initial Mock data
const initialTotems = [
    { id: "T-001", terminal: "Terminal Alameda - Puerta 1", status: "Activo", sales: 1254, revenue: 1450000, lastUpdate: "10:45 AM", ip: "192.168.1.10" },
    { id: "T-002", terminal: "Terminal Sur - Pasillo Central", status: "Activo", sales: 856, revenue: 980000, lastUpdate: "10:42 AM", ip: "192.168.1.11" },
    { id: "T-003", terminal: "Aeropuerto SCL - Llegadas", status: "Error", sales: 42, revenue: 85000, lastUpdate: "08:15 AM", ip: "192.168.1.12" },
    { id: "T-004", terminal: "Terminal San Borja", status: "Activo", sales: 3450, revenue: 4200000, lastUpdate: "10:44 AM", ip: "192.168.1.13" },
    { id: "T-005", terminal: "Terminal Viña del Mar", status: "Inactivo", sales: 0, revenue: 0, lastUpdate: "Ayer 22:00", ip: "192.168.1.14" },
];

export default function TotemDashboard() {
    const [totems, setTotems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedTotemId, setExpandedTotemId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
    
    // States for Edit Mode
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ identificador: "", direccion: "", status: "Activo" });

    // States for Create Mode
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ identificador: "", direccion: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Resize Sidebar Logic
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        fetchTotems();
    }, []);

    const fetchTotems = async () => {
        try {
            setLoading(true);
            const data = await apiFetch("/totems");
            // Adaptar datos de la API si es necesario
            setTotems(data);
        } catch (error) {
            console.error("Error fetching totems:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (t: any) => {
        setEditingId(t.id);
        setEditForm({ 
            identificador: t.identificador || "", 
            direccion: t.direccion || "", 
            status: t.status || "Activo" 
        });
    };

    const handleSave = async (id: string) => {
        try {
            setIsSaving(true);
            await apiFetch(`/totems/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    identificador: editForm.identificador,
                    direccion: editForm.direccion,
                    video_ids: [] // Por ahora vacío
                })
            });
            await fetchTotems();
            setEditingId(null);
        } catch (error) {
            alert("Error al actualizar: " + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async () => {
        try {
            setIsSaving(true);
            await apiFetch("/totems", {
                method: "POST",
                body: JSON.stringify({
                    identificador: createForm.identificador,
                    direccion: createForm.direccion,
                    video_ids: []
                })
            });
            await fetchTotems();
            setIsCreateModalOpen(false);
            setCreateForm({ identificador: "", direccion: "" });
        } catch (error) {
            alert("Error al crear: " + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este tótem?")) return;
        try {
            await apiFetch(`/totems/${id}`, { method: "DELETE" });
            await fetchTotems();
        } catch (error) {
            alert("Error al eliminar: " + (error as Error).message);
        }
    };

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
                        <SidebarItem icon={<TabletSmartphone size={18} />} label="Totem" active />
                        <SidebarItem icon={<Building size={18} />} label="Empresa" />
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
                <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Inicio</span>
                        <span>/</span>
                        <span className="text-slate-800 font-medium">Tótems</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full">ROL: SUPER_ADMIN</span>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 relative">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Tótems de Venta</h2>
                            <p className="text-slate-500 text-sm">Monitoreo en tiempo real de terminales físicos y métricas de recaudación.</p>
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
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "list" ? "bg-slate-50 text-blue-700 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-700 border border-transparent"}`}
                                >
                                    <LayoutList size={18} />
                                    Lista
                                </button>
                                <button 
                                    onClick={() => setViewMode("grid")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "grid" ? "bg-slate-50 text-blue-700 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-700 border border-transparent"}`}
                                >
                                    <LayoutGrid size={18} />
                                    Cuadros
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FILTROS */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
                        <div className="relative mb-5">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar equipo..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                            <div>
                                <input type="text" placeholder="ID Términal" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <input type="text" placeholder="Ubicación" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600">Status:</span>
                                <select className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-colors">
                                    <option>Todos</option>
                                    <option>Activos</option>
                                    <option>Inactivos</option>
                                    <option>Con Error</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-medium">
                                <CheckCircle2 size={16} />
                                <span>Activos: 18</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-sm font-medium">
                                <XCircle size={16} />
                                <span>Inactivos: 2</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-sm font-medium">
                                <AlertCircle size={16} />
                                <span>Desconectados: 1</span>
                            </div>
                        </div>
                    </div>

                    {/* VISTA DINÁMICA: LISTA O GRID */}
                    {viewMode === "list" ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                        <th className="py-3 px-5 font-semibold w-12 text-center"></th>
                                        <th className="py-3 px-5 font-semibold w-24">ID</th>
                                        <th className="py-3 px-5 font-semibold">TERMINAL / UBICACIÓN</th>
                                        <th className="py-3 px-5 font-semibold w-40 text-right pr-6">TICKETS HOY</th>
                                        <th className="py-3 px-5 font-semibold w-40 text-right pr-6">RECAUDACIÓN</th>
                                        <th className="py-3 px-5 font-semibold w-32 text-center">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-500 mb-2"/> Cargando equipos...</td></tr>
                                    ) : totems.length === 0 ? (
                                        <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-medium">No se encontraron tótems registrados.</td></tr>
                                    ) : (
                                        totems.map((t) => (
                                            <React.Fragment key={t.id}>
                                                <tr 
                                                    onClick={() => toggleExpand(t.id)}
                                                    className={`border-b transition-colors cursor-pointer group select-none ${expandedTotemId === t.id ? 'bg-blue-50/40 border-blue-100' : 'border-slate-100 hover:bg-slate-50'}`}
                                                >
                                                    <td className="py-3.5 px-5 text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        {expandedTotemId === t.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </td>
                                                    <td className="py-3.5 px-5 font-medium text-slate-600 flex items-center gap-2 text-xs">
                                                        <Hash size={10} className="text-slate-400" />
                                                        {t.id.toString().substring(0, 8)}
                                                    </td>
                                                    <td className="py-3.5 px-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">{t.identificador}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{t.direccion}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-5 font-semibold text-slate-600 text-right pr-6">{t.sales || 0} <span className="text-xs text-slate-400 font-normal ml-0.5">uni.</span></td>
                                                    <td className="py-3.5 px-5 font-semibold text-emerald-600 text-right pr-6">${(t.revenue || 0).toLocaleString('es-CL')}</td>
                                                    <td className="py-3.5 px-5 flex justify-center">
                                                        <StatusBadge status={t.status || "Activo"} />
                                                    </td>
                                                </tr>
                                            {/* DETALLES EXPANDIBLES O FORMULARIO DE EDICIÓN */}
                                            {expandedTotemId === t.id && (
                                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                                    <td colSpan={6} className="p-0">
                                                        {editingId === t.id ? (
                                                            /* FORMULARIO DE EDICIÓN EN LISTA */
                                                            <div className="px-16 py-8 animate-in slide-in-from-top-2 duration-200 fade-in">
                                                                <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-6 max-w-4xl mx-auto flex flex-col gap-6">
                                                                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                                                        <h3 className="font-bold text-blue-600 flex items-center gap-2 text-lg">
                                                                            <Edit size={20}/> Editando Configuración: {t.id}
                                                                        </h3>
                                                                        <StatusBadge status={editForm.status} />
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                        <div className="md:col-span-2">
                                                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Identificador del Equipo</label>
                                                                            <input 
                                                                                value={editForm.identificador}
                                                                                onChange={e => setEditForm({...editForm, identificador: e.target.value})}
                                                                                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Estado Operativo</label>
                                                                            <select 
                                                                                value={editForm.status}
                                                                                onChange={e => setEditForm({...editForm, status: e.target.value})}
                                                                                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer"
                                                                            >
                                                                                <option value="Activo">Activo</option>
                                                                                <option value="Inactivo">Inactivo</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="md:col-span-3">
                                                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Dirección / Ubicación Física</label>
                                                                            <input 
                                                                                value={editForm.direccion}
                                                                                onChange={e => setEditForm({...editForm, direccion: e.target.value})}
                                                                                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex gap-3 mt-2 border-t border-slate-100 pt-6">
                                                                        <button onClick={() => setEditingId(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                                                                            <X size={18}/> Cancelar
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleSave(t.id)} 
                                                                            disabled={isSaving}
                                                                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-transform active:scale-[0.98] shadow-md shadow-blue-200 disabled:opacity-50"
                                                                        >
                                                                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
                                                                            Guardar Cambios en el Equipo
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* VISTA DE DETALLES NORMAL */
                                                            <div className="px-16 py-6 flex flex-col md:flex-row gap-10 md:items-start animate-in slide-in-from-top-2 duration-200 fade-in">
                                                                
                                                                {/* Info Block 1 */}
                                                                <div className="flex items-start gap-3 w-1/4">
                                                                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-blue-500 mt-1">
                                                                        <Terminal size={18} strokeWidth={2.5}/>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Información Técnica</h4>
                                                                        <p className="text-sm text-slate-800 font-medium">Dir: {t.direccion}</p>
                                                                        <p className="text-xs text-slate-500 mt-0.5">ID: {t.id}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Info Block 2 */}
                                                                <div className="flex items-start gap-3 w-1/4">
                                                                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-emerald-500 mt-1">
                                                                        <DollarSign size={18} strokeWidth={2.5}/>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transacciones</h4>
                                                                        <p className="text-sm text-slate-800 font-medium">Recaudado: ${(t.revenue || 0).toLocaleString('es-CL')}</p>
                                                                        <p className="text-xs text-emerald-600 mt-0.5 font-medium">Métrica en tiempo real</p>
                                                                    </div>
                                                                </div>

                                                                {/* Acciones */}
                                                                <div className="ml-auto w-1/4 flex flex-col gap-2">
                                                                    <button onClick={() => handleEditClick(t)} className="text-xs font-semibold px-4 py-2.5 border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                                                                        <Edit size={14}/> Modificar Tótem
                                                                    </button>
                                                                    <button onClick={() => handleDelete(t.id)} className="text-xs font-semibold px-4 py-2.5 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                                                                        <Trash2 size={14}/> Eliminar Equipo
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                            {loading ? (
                                <div className="col-span-full py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-500 mb-2"/> Cargando equipos...</div>
                            ) : totems.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-slate-400 font-medium">No se encontraron tótems registrados.</div>
                            ) : totems.map(t => {
                                const isEditing = editingId === t.id;

                                return (
                                <div key={t.id} className={`bg-white rounded-2xl border ${isEditing ? 'border-blue-400 ring-4 ring-blue-50 scale-[1.02] shadow-lg relative z-10' : 'border-slate-200 hover:shadow-md'} shadow-sm transition-all flex flex-col overflow-hidden group`}>
                                    
                                    {isEditing ? (
                                        // MODO EDICIÓN GRID
                                        <div className="p-5 flex-1 flex flex-col gap-4">
                                            <div className="flex justify-between items-center mb-1 border-b border-slate-100 pb-3">
                                                 <h3 className="font-bold text-blue-600 flex items-center gap-2"><Edit size={16}/> Editando Equipo</h3>
                                            </div>
                                            
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">Identificador</label>
                                                <input 
                                                    value={editForm.identificador}
                                                    onChange={e => setEditForm({...editForm, identificador: e.target.value})}
                                                    className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">Dirección / Ubicación</label>
                                                <input 
                                                    value={editForm.direccion}
                                                    onChange={e => setEditForm({...editForm, direccion: e.target.value})}
                                                    className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            
                                            <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                                                <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"><X size={16}/> Cancelar</button>
                                                <button onClick={() => handleSave(t.id)} disabled={isSaving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} 
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // MODO VISTA GRID
                                        <div className="flex h-full min-h-[200px]">
                                            {/* Lado del Icono (Botón de Modificar) */}
                                            <button 
                                                onClick={() => handleEditClick(t)}
                                                className="w-2/5 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 group/icon transition-all duration-300 relative overflow-hidden"
                                                title="Haga clic para modificar el tótem"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/0 to-blue-400/0 group-hover/icon:from-blue-400/5 group-hover/icon:to-transparent transition-all duration-500" />
                                                
                                                <div className="p-5 rounded-3xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover/icon:text-blue-600 group-hover/icon:scale-110 group-hover/icon:shadow-md transition-all duration-500 z-10">
                                                    <MonitorSmartphone size={44} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col items-center z-10">
                                                    <span className="text-[10px] font-black text-blue-600/0 group-hover/icon:text-blue-600 transition-all uppercase tracking-widest translate-y-2 group-hover/icon:translate-y-0 duration-300">Modificar</span>
                                                    <span className="text-[9px] font-bold text-slate-400 group-hover/icon:opacity-0 transition-opacity uppercase tracking-tighter">Terminal</span>
                                                </div>
                                            </button>
                                            
                                            {/* Lado de Detalles */}
                                            <div className="flex-1 p-5 flex flex-col justify-between bg-white">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <StatusBadge status={t.status || "Activo"} />
                                                        <span className="text-[10px] font-bold text-slate-300 tracking-widest whitespace-nowrap ml-2">ID: {t.id.toString().substring(0, 6)}</span>
                                                    </div>
                                                    
                                                    <h3 className="font-bold text-slate-800 text-[16px] leading-tight mb-4 group-hover:text-blue-700 transition-colors line-clamp-2">
                                                        {t.identificador}
                                                    </h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Métricas rápidas */}
                                                    <div className="flex justify-between items-end border-b border-slate-50 pb-3">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 block mb-0.5 tracking-wider uppercase">Recaudado</span>
                                                            <span className="text-xl font-black text-slate-800 tracking-tight">${(t.revenue || 0).toLocaleString('es-CL')}</span>
                                                        </div>
                                                    </div>

                                                    {/* Info técnica */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Terminal size={10} /> Ubicación</span>
                                                            <span className="text-[10px] text-slate-700 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-[100px] truncate">{t.direccion}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                            className="flex-1 py-2 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Trash2 size={12}/> Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL NUEVO TOTEM */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Nuevo Terminal</h3>
                                    <p className="text-blue-100 text-xs font-medium">Registrar equipo en la red</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Identificador del Tótem</label>
                                <input 
                                    type="text"
                                    placeholder="Ej: Terminal Alameda - Totem 5"
                                    value={createForm.identificador}
                                    onChange={e => setCreateForm({...createForm, identificador: e.target.value})}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Dirección / Ubicación Física</label>
                                <input 
                                    type="text"
                                    placeholder="Ej: Av. Libertador 1234, Local 45"
                                    value={createForm.direccion}
                                    onChange={e => setCreateForm({...createForm, direccion: e.target.value})}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm outline-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleCreate}
                                    disabled={isSaving || !createForm.identificador || !createForm.direccion}
                                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <>Registrar Equipo</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "Activo") return <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-emerald-200 uppercase">Activo</span>;
    if (status === "Inactivo") return <span className="bg-slate-100/80 text-slate-600 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-slate-200 uppercase">Inactivo</span>;
    if (status === "Error" || status === "Error Físico") return <span className="bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-rose-200 uppercase">Con Error</span>;
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
