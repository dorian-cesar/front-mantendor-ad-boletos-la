import React from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { DollarSign, AlertCircle } from "lucide-react";

export function FinanzasDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-auto py-4 md:h-20 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-8 lg:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 transition-colors">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <DollarSign className="text-slate-900 dark:text-white" size={28} />
              Gestión de Finanzas
            </h1>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              Administración de devoluciones y reembolsos
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
              Módulo en Construcción
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              El área de finanzas para gestionar las devoluciones de pasajes está siendo preparada. Pronto estará disponible.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
