import React, { useState } from "react";
import { LogOut, TabletSmartphone, Building, Video, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md shadow-slate-900/10 dark:shadow-white/5"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {React.isValidElement(icon) &&
        React.cloneElement(icon as React.ReactElement<any>, {
          size: 20,
          className: active ? "text-white dark:text-slate-900" : "text-slate-400 dark:text-slate-500",
        })}
      {label}
    </Link>
  );
}

export function Sidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isDragging, setIsDragging] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleMouseDown = () => setIsDragging(true);

  // Theme logic
  const [isDarkMode, setIsDarkMode] = useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
  
  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className={`relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between flex-shrink-0 ${
        isDragging ? "transition-none select-none" : "transition-none"
      }`}
    >
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 -right-[3px] w-[6px] h-full cursor-col-resize z-20 group flex items-center justify-center"
      >
        <div
          className={`w-[3px] h-full transition-colors ${
            isDragging ? "bg-slate-400 dark:bg-slate-600" : "bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-800"
          }`}
        />
      </div>

      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 mb-6">
          <img 
            src={isDarkMode ? "/assets/logo-wit-mini-dark.png" : "/assets/logo-wit-mini-dark.png"} 
            alt="WIT Logo" 
            className="h-8 w-auto object-contain invert dark:invert-0"
          />
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
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 overflow-hidden whitespace-nowrap w-full space-y-2">
        <button 
          onClick={toggleDarkMode}
          className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-sm font-medium">{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
