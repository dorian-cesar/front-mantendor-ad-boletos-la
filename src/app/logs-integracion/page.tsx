"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/jwt";
import { Loader2 } from "lucide-react";
import { LogsDashboard } from "@/features/logs/LogsDashboard";

export default function LogsIntegracionPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const role = getUserRole();
    if (role === "ADMIN") {
      setIsAuthorized(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return <LogsDashboard />;
}
