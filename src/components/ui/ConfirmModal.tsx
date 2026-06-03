"use client";

import React from "react";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmBg =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
      : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20";

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-md w-full p-6 animate-in zoom-in-95 duration-200 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto ${
            variant === "danger"
              ? "bg-red-50 border border-red-100"
              : "bg-amber-50 border border-amber-100"
          }`}
        >
          {variant === "danger" ? (
            <Trash2 size={26} className="text-red-500" />
          ) : (
            <AlertTriangle size={26} className="text-amber-500" />
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-500 text-center leading-relaxed mb-7">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 text-white rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] ${confirmBg}`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
