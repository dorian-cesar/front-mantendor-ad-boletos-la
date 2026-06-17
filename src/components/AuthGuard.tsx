"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Si estamos en la página de login o en una ruta pública como la API,
    // no hacemos la validación de token y dejamos pasar.
    if (pathname === "/login" || pathname?.startsWith("/api")) {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc]">
        <Loader2 size={32} className="animate-spin text-slate-400 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Verificando sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}
