import { LogOut, TabletSmartphone, Building, Video, Key, ShoppingCart, Menu, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all ${
        active
          ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {React.isValidElement(icon) &&
        React.cloneElement(icon as React.ReactElement<any>, {
          size: 20,
          className: active ? "text-white " : "text-slate-400 ",
        })}
      {label}
    </Link>
  );
}

export function Sidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("token");
      router.push("/login");
    }, 500); // Pequeño retraso para que la animación del loader sea visible
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 480) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isDragging]);
  
  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setIsOpenMobile(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 bg-slate-900 text-white p-3.5 rounded-full shadow-xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all"
      >
        <Menu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isOpenMobile && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 z-40 animate-in fade-in duration-200" 
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '280px' : `${sidebarWidth}px` }}
        className={`fixed md:relative inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        } ${isDragging ? "md:transition-none select-none" : "md:transition-none"}`}
      >
        <div
          onMouseDown={handleMouseDown}
          className="hidden md:flex absolute top-0 -right-[3px] w-[6px] h-full cursor-col-resize z-20 group items-center justify-center"
        >
        <div
          className={`w-[3px] h-full transition-colors ${
            isDragging ? "bg-slate-400" : "bg-transparent group-hover:bg-slate-200"
          }`}
        />
      </div>

      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 mb-6">
          <img 
            src="/assets/logo-wit-mini-dark.png" 
            alt="WIT Logo" 
            className="h-8 w-auto object-contain"
          />
          <button 
            className="md:hidden text-slate-400 hover:text-slate-700" 
            onClick={() => setIsOpenMobile(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 space-y-1.5">
          <SidebarItem
            icon={<TabletSmartphone />} 
            label="Totem"
            href="/totems"
            active={pathname === "/totems"}
          />
          <SidebarItem
            icon={<Building />}
            label="Empresa"
            href="/empresas"
            active={pathname === "/empresas"}
          />
          <SidebarItem
            icon={<Video />}
            label="Videos"
            href="/videos"
            active={pathname === "/videos"}
          />
          <SidebarItem
            icon={<ShoppingCart />}
            label="Ventas"
            href="/ventas"
            active={pathname === "/ventas"}
          />
          <SidebarItem
            icon={<Key />}
            label="API Keys"
            href="/api-keys"
            active={pathname === "/api-keys"}
          />
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 overflow-hidden whitespace-nowrap w-full">
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 text-slate-500 hover:text-slate-800 transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          <span className="text-sm font-medium">{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
