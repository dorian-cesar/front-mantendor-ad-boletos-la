import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { DollarSign, AlertCircle, CheckCircle2, XCircle, Clock, Search, X, Loader2, User, Building, Landmark, Save, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socketClient";

interface Devolucion {
  id: number;
  ticket_number: string;
  monto: number;
  origen: string;
  pais: string;
  motivo: string;
  estado: string;
  porcentaje_devolucion: number | null;
  resolucion_descripcion: string | null;
  datos_pasajero: any;
  datos_boleto: any;
  datos_bancarios: any;
  createdAt: string;
  totem?: { identificador: string; direccion: string };
  gestor?: { nombre: string; email: string };
}

export function FinanzasDashboard() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevolucion, setSelectedDevolucion] = useState<Devolucion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Resolución Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolucionEstado, setResolucionEstado] = useState<"APROBADA" | "RECHAZADA">("APROBADA");
  const [resolucionPorcentaje, setResolucionPorcentaje] = useState<number>(100);
  const [resolucionDescripcion, setResolucionDescripcion] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchDevoluciones();

    const socket = getSocket();
    const refreshData = () => fetchDevoluciones();

    // Escuchar actualizaciones en tiempo real
    socket.on("nueva_devolucion", refreshData);
    socket.on("devolucion_actualizada", refreshData);

    return () => {
      socket.off("nueva_devolucion", refreshData);
      socket.off("devolucion_actualizada", refreshData);
    };
  }, []);

  const fetchDevoluciones = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/devoluciones');
      setDevoluciones(data);
    } catch (error) {
      console.error("Error fetching devoluciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevolucion) return;
    
    if (!resolucionDescripcion.trim()) {
      setErrorMsg("Debe ingresar una justificación obligatoria.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      const body = {
        estado: resolucionEstado,
        porcentaje_devolucion: resolucionEstado === "APROBADA" ? resolucionPorcentaje : 0,
        resolucion_descripcion: resolucionDescripcion
      };

      await apiFetch(`/devoluciones/${selectedDevolucion.id}/estado`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });

      // Refrescar lista y cerrar panel
      await fetchDevoluciones();
      setSelectedDevolucion(null);
      
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar la resolución");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPanel = (dev: Devolucion) => {
    setSelectedDevolucion(dev);
    setResolucionEstado("APROBADA");
    setResolucionPorcentaje(100);
    setResolucionDescripcion("");
    setErrorMsg("");
  };

  const filteredDevoluciones = devoluciones.filter(d => 
    d.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.pais.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 relative">
        <header className="h-auto py-4 md:h-20 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-8 lg:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 transition-colors z-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <DollarSign className="text-slate-900 dark:text-white" size={28} />
              Gestión de Finanzas
            </h1>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              Administración de devoluciones y reembolsos
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por ticket o país..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-zinc-800 border-none rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-slate-400 outline-none text-slate-700 dark:text-slate-200 transition-all"
            />
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-10 flex gap-6 relative">
          
          {/* Tabla de Devoluciones */}
          <div className={`flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 ${selectedDevolucion ? 'hidden xl:flex opacity-50 pointer-events-none' : 'flex'}`}>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  Cargando devoluciones...
                </div>
              ) : filteredDevoluciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <AlertCircle size={32} className="mb-2 opacity-50" />
                  <p>No se encontraron devoluciones.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-zinc-800/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Fecha</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Ticket / País</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Pasajero</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Monto</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Banco / Beneficiario</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800 hidden md:table-cell">Motivo</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Estado</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {filteredDevoluciones.map((dev) => (
                      <tr 
                        key={dev.id} 
                        className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(dev.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{dev.ticket_number}</div>
                          <div className="text-xs font-bold text-slate-600 bg-slate-200 dark:bg-zinc-700 w-fit px-2 py-0.5 rounded mt-1">País: {dev.pais} • {dev.origen}</div>
                          {dev.datos_boleto && (
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                              {dev.datos_boleto.origen} ➔ {dev.datos_boleto.destino}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{dev.datos_pasajero?.nombre || 'Desconocido'}</div>
                          <div className="text-xs text-slate-500">{dev.datos_pasajero?.documento || 'S/D'}</div>
                          <div className="text-xs text-slate-400">{dev.datos_pasajero?.email || ''}</div>
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(dev.monto)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{dev.datos_bancarios?.banco || 'No indicado'}</div>
                          <div className="text-xs text-slate-500">
                            Cta. {dev.datos_bancarios?.tipo_cuenta} {dev.datos_bancarios?.numero_cuenta}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Beneficiario: <span className="font-bold">{dev.datos_bancarios?.nombre_beneficiario}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Doc: {dev.datos_bancarios?.tipo_documento_beneficiario || 'N/A'} {dev.datos_bancarios?.documento_beneficiario || ''}
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <div className="text-xs text-slate-500 max-w-[200px] truncate" title={dev.motivo || ''}>
                            {dev.motivo || 'Sin motivo'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {dev.estado === 'PENDIENTE' && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-md w-fit">
                              <Clock size={14} /> PENDIENTE
                            </span>
                          )}
                          {dev.estado === 'APROBADA' && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-md w-fit">
                              <CheckCircle2 size={14} /> APROBADA
                            </span>
                          )}
                          {dev.estado === 'RECHAZADA' && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 px-2.5 py-1 rounded-md w-fit">
                              <XCircle size={14} /> RECHAZADA
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => openPanel(dev)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md transition-all"
                          >
                            {dev.estado === 'PENDIENTE' ? 'Resolver' : 'Ver Detalles'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Panel Lateral Flotante de Resolución */}
          {selectedDevolucion && (
            <div className="absolute inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-30">
              <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/30">
                <div>
                  <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Resolver Devolución</h2>
                  <p className="text-xs text-slate-500">Ticket: {selectedDevolucion.ticket_number}</p>
                </div>
                <button 
                  onClick={() => setSelectedDevolucion(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-zinc-800 rounded-full shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* Detalles de la compra y motivo */}
                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-slate-100 dark:border-zinc-700/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Monto Solicitado</span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(selectedDevolucion.monto)}</div>
                    </div>
                    {selectedDevolucion.estado !== 'PENDIENTE' && (
                      <span className="px-3 py-1 bg-slate-200 dark:bg-zinc-700 text-xs font-bold rounded text-slate-700 dark:text-slate-300">
                        YA RESUELTO POR: {selectedDevolucion.gestor?.nombre || 'Desconocido'}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-2 mb-1"><FileText size={14}/> Motivo de Cancelación</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                      {selectedDevolucion.motivo || "No especificado"}
                    </p>
                  </div>
                </div>

                {/* Grid 2 columnas para Pasajero y Banco */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <User size={14}/> Pasajero
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-slate-500">Nombre:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_pasajero?.nombre || '-'}</span></p>
                      <p><span className="text-slate-500">Documento:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_pasajero?.documento || '-'}</span></p>
                      <p><span className="text-slate-500">Email:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_pasajero?.email || '-'}</span></p>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <Landmark size={14}/> Datos Bancarios
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-slate-500">Banco:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_bancarios?.banco || '-'}</span></p>
                      <p><span className="text-slate-500">Tipo:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_bancarios?.tipo_cuenta || '-'}</span></p>
                      <p><span className="text-slate-500">N° Cta:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_bancarios?.numero_cuenta || '-'}</span></p>
                      <p><span className="text-slate-500">Beneficiario:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_bancarios?.nombre_beneficiario || '-'}</span></p>
                      <p><span className="text-slate-500">Doc Ben:</span> <span className="font-medium dark:text-slate-200">{selectedDevolucion.datos_bancarios?.tipo_documento_beneficiario} {selectedDevolucion.datos_bancarios?.documento_beneficiario}</span></p>
                    </div>
                  </div>

                </div>

                {/* Bloque de Formulario de Resolución (Solo si está PENDIENTE) */}
                {selectedDevolucion.estado === 'PENDIENTE' ? (
                  <form onSubmit={handleResolver} className="border-t border-slate-200 dark:border-zinc-800 pt-6 mt-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Tomar Decisión</h3>
                    
                    {errorMsg && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                        <AlertCircle size={16} /> {errorMsg}
                      </div>
                    )}

                    <div className="flex gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setResolucionEstado("APROBADA")}
                        className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${resolucionEstado === 'APROBADA' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600'}`}
                      >
                        Aprobar Reembolso
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolucionEstado("RECHAZADA")}
                        className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${resolucionEstado === 'RECHAZADA' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600'}`}
                      >
                        Rechazar
                      </button>
                    </div>

                    {resolucionEstado === 'APROBADA' && (
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 mb-2">Porcentaje a Devolver (%)</label>
                        <input 
                          type="number" 
                          min="1" max="100" 
                          value={resolucionPorcentaje}
                          onChange={(e) => setResolucionPorcentaje(Number(e.target.value))}
                          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-500 mb-2">Justificación / Motivo de la decisión (Obligatorio)</label>
                      <textarea 
                        rows={3}
                        value={resolucionDescripcion}
                        onChange={(e) => setResolucionDescripcion(e.target.value)}
                        placeholder="Ej: Aprobado con penalidad de 15% por cancelación tardía..."
                        className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                      Guardar Resolución
                    </button>
                  </form>
                ) : (
                  <div className="border-t border-slate-200 dark:border-zinc-800 pt-6 mt-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText size={14} /> Resolución de Finanzas
                    </h3>
                    <div className={`p-4 rounded-xl border ${selectedDevolucion.estado === 'APROBADA' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/50 text-red-800 dark:text-red-300'}`}>
                      {selectedDevolucion.estado === 'APROBADA' && (
                        <p className="font-bold mb-2">Porcentaje devuelto: {selectedDevolucion.porcentaje_devolucion}%</p>
                      )}
                      <p className="text-sm">"{selectedDevolucion.resolucion_descripcion}"</p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          )}

          {/* Overlay oscuro para móviles/tablets cuando el panel lateral está abierto */}
          {selectedDevolucion && (
            <div 
              className="absolute inset-0 bg-slate-900/20 xl:hidden z-20 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedDevolucion(null)}
            />
          )}
          
        </div>
      </main>
    </div>
  );
}
