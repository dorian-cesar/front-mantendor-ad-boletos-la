import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { ActivitySquare, AlertCircle, FileJson, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface LogEntry {
  id: number;
  ticket_number: string;
  operacion: string;
  estado: string;
  respuesta_integracion: any;
  mensaje_error: string | null;
  pais: string;
  createdAt: string;
}

export function LogsDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/logs-operaciones');
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-auto py-4 md:h-20 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-8 lg:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 transition-colors">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ActivitySquare className="text-slate-900 dark:text-white" size={28} />
              Logs del Sistema
            </h1>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              Registro de integraciones y comunicación con el sistema de reservas
            </p>
          </div>
          <button 
            onClick={fetchLogs}
            className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors"
          >
            Actualizar
          </button>
        </header>

        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-10 flex gap-6">
          {/* Listado de Logs */}
          <div className={`flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden ${selectedLog ? 'hidden lg:flex' : 'flex'}`}>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mb-4"></div>
                  Cargando registros...
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <AlertCircle size={32} className="mb-2 opacity-50" />
                  <p>No hay registros de integración todavía.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-zinc-800/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Fecha</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Ticket</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Operación</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">Estado</th>
                      <th className="py-4 px-6 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">País</th>
                      <th className="py-4 px-6 border-b border-slate-200 dark:border-zinc-800 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {logs.map((log) => (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer ${selectedLog?.id === log.id ? 'bg-slate-50 dark:bg-zinc-800/50' : ''}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                          {log.ticket_number}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                            {log.operacion}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {log.estado === 'EXITO' ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-md w-fit">
                              <CheckCircle2 size={14} /> ÉXITO
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 px-2.5 py-1 rounded-md w-fit">
                              <XCircle size={14} /> ERROR
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                          {log.pais}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                            <FileJson size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Panel de Detalle JSON */}
          {selectedLog && (
            <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl lg:shadow-none animate-in slide-in-from-right-8 duration-300">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/30">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Detalle de Petición</h3>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="lg:hidden text-slate-400 hover:text-slate-700"
                >
                  Cerrar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket / Operación</span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedLog.ticket_number} - {selectedLog.operacion}</div>
                  </div>

                  {selectedLog.mensaje_error && (
                    <div>
                      <span className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Mensaje de Error</span>
                      <div className="text-sm p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-900/50">
                        {selectedLog.mensaje_error}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileJson size={14} /> Respuesta Bruta (JSON)
                    </span>
                    <pre className="text-xs p-4 bg-slate-900 text-slate-300 rounded-xl overflow-x-auto custom-scrollbar">
                      {selectedLog.respuesta_integracion 
                        ? JSON.stringify(selectedLog.respuesta_integracion, null, 2)
                        : "No hay respuesta JSON."}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
