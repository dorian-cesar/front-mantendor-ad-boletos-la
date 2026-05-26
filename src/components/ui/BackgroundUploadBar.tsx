"use client";

import React from "react";
import { useUpload } from "@/features/videos/UploadContext";
import { Loader2, CheckCircle2, XCircle, X, Maximize2, FileVideo } from "lucide-react";

export function BackgroundUploadBar() {
  const { job, isMinimized, restoreModal, cancelUpload, dismissJob } = useUpload();

  // Solo mostrar cuando hay un job activo y el modal está minimizado
  if (!job || !isMinimized) return null;

  const stageConfig = {
    loading: {
      color: "bg-slate-500",
      barColor: "bg-slate-500",
      icon: <Loader2 size={16} className="animate-spin text-slate-500" />,
    },
    compressing: {
      color: "bg-slate-900",
      barColor: "bg-slate-900",
      icon: <Loader2 size={16} className="animate-spin text-slate-700" />,
    },
    uploading: {
      color: "bg-emerald-500",
      barColor: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]",
      icon: <Loader2 size={16} className="animate-spin text-emerald-600" />,
    },
    done: {
      color: "bg-emerald-500",
      barColor: "bg-emerald-500",
      icon: <CheckCircle2 size={16} className="text-emerald-600" />,
    },
    error: {
      color: "bg-red-500",
      barColor: "bg-red-500",
      icon: <XCircle size={16} className="text-red-500" />,
    },
  };

  const config = stageConfig[job.stage];

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[9999] w-auto md:w-[380px] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/15 overflow-hidden">
        {/* Progress bar (top edge) */}
        <div className="h-1 bg-slate-100 w-full">
          <div
            className={`h-full ${config.barColor} transition-all duration-500 ease-out`}
            style={{ width: `${job.stage === "done" ? 100 : job.progress}%` }}
          />
        </div>

        <div className="px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 md:gap-4">
          {/* Icon */}
          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            job.stage === "done" ? "bg-emerald-50" : job.stage === "error" ? "bg-red-50" : "bg-slate-50"
          }`}>
            {config.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileVideo size={12} className="text-slate-400 flex-shrink-0" />
              <p className="text-xs font-bold text-slate-900 truncate">{job.fileName}</p>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{job.message}</p>
            {(job.stage === "compressing" || job.stage === "uploading") && (
              <p className={`text-[11px] font-black mt-0.5 ${
                job.stage === "uploading" ? "text-emerald-600" : "text-slate-800"
              }`}>
                {job.progress}%
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(job.stage === "compressing" || job.stage === "uploading" || job.stage === "loading") && (
              <>
                <button
                  onClick={restoreModal}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
                  title="Expandir"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={cancelUpload}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                  title="Cancelar subida"
                >
                  <X size={14} />
                </button>
              </>
            )}
            {(job.stage === "done" || job.stage === "error") && (
              <button
                onClick={dismissJob}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
