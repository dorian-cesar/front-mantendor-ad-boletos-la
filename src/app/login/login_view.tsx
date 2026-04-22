"use client";

import React, { useState } from "react";
import { LogIn, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

interface LoginResponse {
    token: string;
    message?: string;
    user?: {
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
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = (await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            })) as LoginResponse;

            if (data.token) {
                localStorage.setItem("token", data.token);
                // Si el backend provee rol de usuario, podríamos guardarlo aquí:
                // if (data.user?.rol) localStorage.setItem("rol", data.user.rol);
                router.push("/totems");
            } else {
                throw new Error("Respuesta inválida del servidor: Token no recibido");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión. Verifique sus credenciales o la conexión al servidor.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fc] p-4 font-sans">
            <div className="w-full max-w-md">
                {/* LOGO AREA */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mb-4 animate-in zoom-in duration-500">
                        <LogIn size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin<span className="text-blue-600">Connect</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Mantenedor de Boletos y Publicidad</p>
                </div>

                {/* LOGIN CARD */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 transition-all">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 font-sans">Iniciar Sesión</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@ejemplo.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
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
