import React, { useState } from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: active ? "text-blue-600" : "text-slate-400",
      })}
      {label}
    </Link>
  );
}

export function Sidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isDragging, setIsDragging] = useState(false);
  const pathname = usePathname();

  const handleMouseDown = () => setIsDragging(true);

  // Note: Dragging logic would ideally be in a custom hook or global mouse listener
  // For now, keeping it simple as a component
  
  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className={`relative bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 ${
        isDragging ? "transition-none select-none" : "transition-none"
      }`}
    >
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 -right-[3px] w-[6px] h-full cursor-col-resize z-20 group flex items-center justify-center"
      >
        <div
          className={`w-[3px] h-full transition-colors ${
            isDragging ? "bg-blue-500" : "bg-transparent group-hover:bg-blue-300"
          }`}
        />
      </div>

      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 mb-6">
          <span className="font-bold text-xl tracking-tight">
            Panel<span className="text-blue-500">Admin</span>
          </span>
        </div>

        <nav className="px-4 space-y-1.5">
          <SidebarItem
            icon={<span className="lucide-tablet-smartphone" />} 
            label="Totem"
            href="/totems"
            active={pathname === "/totems"}
          />
          <SidebarItem
            icon={<span className="lucide-building" />}
            label="Empresa"
            href="/empresas"
            active={pathname === "/empresas"}
          />
          <SidebarItem
            icon={<span className="lucide-video" />}
            label="Videos"
            href="/videos"
            active={pathname === "/videos"}
          />
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 overflow-hidden whitespace-nowrap w-full">
        <button className="flex items-center gap-3 text-slate-500 hover:text-slate-800 transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-50">
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
