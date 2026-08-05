"use client";

import React, { useState } from "react";
import { LogIn, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

interface LoginResponse {
    token: string;
    message?: string;
    usuario?: {
        id: number | string;
        email: string;
        rol?: string;
    };
}

export default function LoginView() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const router = useRouter();

    const validate = (): boolean => {
        const errors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            errors.email = "El correo electrónico es obligatorio.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.email = "Ingresa un correo electrónico válido.";
        }

        if (!password) {
            errors.password = "La contraseña es obligatoria.";
        } else if (password.length < 4) {
            errors.password = "La contraseña debe tener al menos 4 caracteres.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!validate()) return;

        setLoading(true);

        try {
            const data = (await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: email.trim(), password }),
            })) as LoginResponse;

            if (data.token) {
                localStorage.setItem("token", data.token);
                if (data.usuario?.rol === "FINANZAS") {
                    router.push("/finanzas");
                } else {
                    router.push("/totems");
                }
            } else {
                throw new Error("Respuesta inválida del servidor: Token no recibido");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Error al iniciar sesión. Verifique sus credenciales o la conexión al servidor.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fc] p-4 font-sans">
            <div className="w-full max-w-md">
                {/* LOGO AREA */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-4 animate-in fade-in zoom-in duration-700">
                        <img
                            src="/assets/logo-wit-dark.png"
                            alt="WIT Logo"
                            className="h-20 w-auto object-contain drop-shadow-sm"
                        />
                    </div>
                </div>

                {/* LOGIN CARD */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 transition-all">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 font-sans">Iniciar Sesión</h2>

                    {/* Error banner - visible en rojo */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                        {/* EMAIL */}
                        <div>
                            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${fieldErrors.email ? "text-red-400" : "text-slate-400 group-focus-within:text-slate-900"}`}>
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                                    }}
                                    placeholder="admin@ejemplo.com"
                                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:bg-white transition-all outline-none ${
                                        fieldErrors.email
                                            ? "border-red-300 focus:ring-red-500/10 focus:border-red-500 bg-red-50/30"
                                            : "border-slate-200 focus:ring-slate-900/10 focus:border-slate-900"
                                    }`}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1.5 px-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                                    <AlertCircle size={11} /> {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${fieldErrors.password ? "text-red-400" : "text-slate-400 group-focus-within:text-slate-900"}`}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                                    }}
                                    placeholder="••••••••"
                                    className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:bg-white transition-all outline-none ${
                                        fieldErrors.password
                                            ? "border-red-300 focus:ring-red-500/10 focus:border-red-500 bg-red-50/30"
                                            : "border-slate-200 focus:ring-slate-900/10 focus:border-slate-900"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="mt-1.5 px-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                                    <AlertCircle size={11} /> {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Verificando...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        Entrar al Panel
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="text-center mt-8 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    &copy; 2026 Plataforma de Gestión Publicitaria
                </div>
            </div>
        </div>
    );
}
