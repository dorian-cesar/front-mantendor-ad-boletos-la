import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socketClient";
import { Totem, ResumenGlobal, TotemForm, UseTotemsOptions } from "./types";

// ============================================================================
// Helpers & Utilities
// ============================================================================

const fetchTotemPlaylist = async (totemId: string | number, token: string | null) => {
  try {
    const res = await fetch(`/api/proxy/totems/${totemId}/playlist`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      const playlistData = await res.json();
      return [...(playlistData.playlist || [])].sort(
        (a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)
      );
    }
  } catch { /* silencioso */ }
  return [];
};

const buildTotemsWithData = async (totemList: Totem[], salesData: any[]): Promise<Totem[]> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return await Promise.all(
    totemList.map(async (totem) => {
      const playlist = await fetchTotemPlaylist(totem.id, token);
      const mySales = salesData.filter((s: any) => String(s.totem_id) === String(totem.id));
      const totalRevenue = mySales.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
      const totalTickets = mySales.reduce((acc: number, curr: any) => acc + (curr.ticket_numbers?.length || 0), 0);

      return { 
        ...totem, 
        playlist,
        revenue: totalRevenue,
        sales: totalTickets
      };
    })
  );
};

const getTotemIdFromEvent = (data: any): string => {
  return String(data?.totemId || data?.totem_id || data?.id || "");
};

// ============================================================================
// Custom Hook
// ============================================================================

export function useTotems(options?: UseTotemsOptions) {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [resumenGlobal, setResumenGlobal] = useState<ResumenGlobal>({ total_transacciones: 0, boletos_vendidos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  // Tracks pending local status changes to avoid overwriting optimistic updates
  const pendingStatusRef = useRef<Map<string, number>>(new Map());

  const loadTotemsData = async () => {
    const data = await apiFetch("/totems");
    const totemList: Totem[] = Array.isArray(data) ? data : (data.totems || []);
    
    if (data.resumen_global) {
      setResumenGlobal(data.resumen_global);
    }

    let salesData: any[] = [];
    try {
      const salesResponse = await apiFetch("/ventas/auditoria");
      salesData = salesResponse.ventas || [];
    } catch (salesErr) {
      console.warn("No se pudieron cargar las ventas para el dashboard de tótems", salesErr);
    }

    return await buildTotemsWithData(totemList, salesData);
  };

  const fetchTotems = async () => {
    try {
      setLoading(true);
      setError(null);
      const totemsWithData = await loadTotemsData();
      setTotems(totemsWithData);
    } catch (err: any) {
      console.error("Error fetching totems:", err);
      setError(err.message || "Error al cargar equipos");
      setTotems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotemsBackground = async () => {
    try {
      const totemsWithData = await loadTotemsData();
      setTotems(prev => {
        return totemsWithData.map(newT => {
          const pendingTime = pendingStatusRef.current.get(String(newT.id));
          if (pendingTime && Date.now() - pendingTime < 10000) {
            const oldT = prev.find(t => String(t.id) === String(newT.id));
            if (oldT) return { ...newT, status: oldT.status };
          } else if (pendingTime) {
            pendingStatusRef.current.delete(String(newT.id));
          }
          return newT;
        });
      });
    } catch (err) {
      console.warn("Background polling for totems failed", err);
    }
  };

  useEffect(() => {
    fetchTotems();
  }, []);

  const fetchPlaylist = async (totemId: string): Promise<any[]> => {
    try {
      const data = await apiFetch(`/totems/${totemId}/playlist`);
      return data.playlist || [];
    } catch {
      return [];
    }
  };

  const handleSave = async (id: string, editForm: TotemForm) => {
    try {
      setIsSaving(true);
      const desiredIds: number[] = (editForm.video_ids || []).map((vId: any) =>
        typeof vId === 'object' ? Number(vId.id) : Number(vId)
      ).filter((n: number) => !isNaN(n));

      const currentTotem = totems.find(t => String(t.id) === String(id));
      const currentIds: number[] = (
        currentTotem?.playlist?.map((v: any) => Number(v.id)) ||
        currentTotem?.videos?.map((v: any) => Number(v.id)) ||
        currentTotem?.video_ids?.map((v: any) => Number(v)) ||
        []
      );

      const videosToAdd = desiredIds.filter(dId => !currentIds.includes(dId));
      const videosToRemove = currentIds.filter(cId => !desiredIds.includes(cId));

      if (videosToAdd.length > 0) {
        await apiFetch(`/totems/${id}/videos`, {
          method: "POST",
          body: JSON.stringify({ video_ids: videosToAdd }),
        });
      }

      for (const videoId of videosToRemove) {
        try {
          await apiFetch(`/totems/${id}/videos/${videoId}`, { method: "DELETE" });
        } catch {
          console.warn(`⚠️ No se pudo quitar video ${videoId}`);
        }
      }

      const putPayload = {
        identificador: editForm.identificador,
        direccion: editForm.direccion,
        latitud: editForm.latitud || 0,
        longitud: editForm.longitud || 0,
      };

      await apiFetch(`/totems/${id}`, {
        method: "PUT",
        body: JSON.stringify(putPayload),
      });

      if (desiredIds.length > 0) {
        const patchPayload = { video_ids: desiredIds };
        try {
          await apiFetch(`/totems/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patchPayload),
          });
        } catch (patchError) {
          try {
            await apiFetch(`/totems/${id}`, {
              method: "PUT",
              body: JSON.stringify({ ...putPayload, video_ids: desiredIds }),
            });
          } catch (putError) {
            console.warn("⚠️ PUT fallback falló:", putError);
          }
        }
      }

      if (desiredIds.length > 0) {
        const reorderPayload = {
          videos: desiredIds.map((videoId, index) => ({
            id: videoId,
            orden: index + 1,
          })),
        };
        try {
          await apiFetch("/videos/reorder", {
            method: "POST",
            body: JSON.stringify(reorderPayload),
          });
        } catch (reorderError) {
          console.warn("⚠️ No se pudo actualizar el orden global:", reorderError);
        }
      }

      await fetchTotems();
      return true;
    } catch (error) {
      console.error("Error en handleSave:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (createForm: TotemForm) => {
    try {
      setIsSaving(true);
      const videoIds = (createForm.video_ids || []).map((v: any) => Number(v)).filter((n: number) => !isNaN(n));

      await apiFetch("/totems", {
        method: "POST",
        body: JSON.stringify({
          id: createForm.id ? String(createForm.id) : undefined,
          identificador: createForm.identificador,
          direccion: createForm.direccion,
          latitud: createForm.latitud || 0,
          longitud: createForm.longitud || 0,
          video_ids: videoIds,
        }),
      });

      await fetchTotems();
      return true;
    } catch (error) {
      console.error("Error creating totem:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/totems/${id}`, { method: "DELETE" });
      await fetchTotems();
    } catch (error) {
      console.error("Error deleting totem:", error);
      throw error;
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    pendingStatusRef.current.set(String(id), Date.now())

    setTotems((prev) => 
      prev.map(t => String(t.id) === String(id) ? { ...t, status: newStatus } : t)
    );

    try {
      await apiFetch(`/totems/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      pendingStatusRef.current.delete(String(id))
      setTotems((prev) => 
        prev.map(t => String(t.id) === String(id) ? { ...t, status: currentStatus } : t)
      );
      alert("Error al cambiar el estado del tótem");
    }
  };

  const toggleBlockScreenSaver = async (id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setTotems((prev) => 
      prev.map(t => String(t.id) === String(id) ? { ...t, block_screen_saver: newValue } : t)
    );

    try {
      await apiFetch(`/totems/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ block_screen_saver: newValue }),
      });
    } catch (error) {
      setTotems((prev) => 
        prev.map(t => String(t.id) === String(id) ? { ...t, block_screen_saver: currentValue } : t)
      );
      alert("Error al actualizar la configuración del protector de pantalla");
    }
  };

  // ============================================================================
  // WebSocket Listeners
  // ============================================================================
  useEffect(() => {
    const socket = getSocket();

    const onInitialMetrics = (totemsArray: any[]) => {
      if (!Array.isArray(totemsArray)) return;
      setTotems(current =>
        current.map(t => {
          const fresh = totemsArray.find(m => String(m.id) === String(t.id));
          if (!fresh) return t;
          return {
            ...t,
            is_online: fresh.is_online,
            status: fresh.status ?? t.status,
            ultimo_login: fresh.last_ping || fresh.ultimo_login || t.ultimo_login,
            ultima_telemetria: fresh.ultima_telemetria || t.ultima_telemetria,
            ultimo_error_critico: fresh.ultimo_error_critico ?? t.ultimo_error_critico,
          };
        })
      );
      setIsPolling(false);
    };

    const onTotemOnline = (data: any) => {
      const tId = getTotemIdFromEvent(data);
      setTotems(current => {
        return current.map(t => {
          if (String(t.id) === tId) {
            if (!t.is_online && options?.onTotemConnect) {
              options.onTotemConnect(t, tId);
            }
            return { ...t, is_online: true };
          }
          return t;
        });
      });
    };

    const onTotemOffline = (data: any) => {
      const tId = getTotemIdFromEvent(data);
      setTotems(current => {
        return current.map(t => {
          if (String(t.id) === tId) {
            if (t.is_online && options?.onTotemDisconnect) {
              options.onTotemDisconnect(t, tId);
            }
            return { ...t, is_online: false };
          }
          return t;
        });
      });
    };

    const onMetricsUpdated = (data: any) => {
      const tId = getTotemIdFromEvent(data);
      setIsPolling(true);
      setTotems(current =>
        current.map(t =>
          String(t.id) === tId
            ? { ...t, ultima_telemetria: data?.metrics || data }
            : t
        )
      );
      setTimeout(() => setIsPolling(false), 800);
    };

    const onTotemStatus = (data: any) => {
      const tId = getTotemIdFromEvent(data);
      const isOnline = data?.is_online !== undefined ? data.is_online : data?.status === 'online';
      setTotems(current =>
        current.map(t =>
          String(t.id) === tId
            ? { ...t, is_online: isOnline }
            : t
        )
      );
    };

    const handleDataUpdated = () => {
      console.log("🔍 [WS:DEBUG] Evento recibido → actualizando datos de tótems silenciosamente...");
      fetchTotemsBackground();
    };

    socket.on("admin:initial_metrics", onInitialMetrics);
    socket.on("admin:totem_online", onTotemOnline);
    socket.on("admin:totem_offline", onTotemOffline);
    socket.on("admin:metrics_updated", onMetricsUpdated);
    socket.on("totem_status", onTotemStatus);
    socket.on("admin:totem_status", onTotemStatus);
    socket.on("admin:ventas_updated", handleDataUpdated);
    socket.on("admin:totems_updated", handleDataUpdated);

    return () => {
      socket.off("admin:initial_metrics", onInitialMetrics);
      socket.off("admin:totem_online", onTotemOnline);
      socket.off("admin:totem_offline", onTotemOffline);
      socket.off("admin:metrics_updated", onMetricsUpdated);
      socket.off("totem_status", onTotemStatus);
      socket.off("admin:totem_status", onTotemStatus);
      socket.off("admin:ventas_updated", handleDataUpdated);
      socket.off("admin:totems_updated", handleDataUpdated);
    };
  }, [options]);

  return {
    totems,
    resumenGlobal,
    loading,
    error,
    isSaving,
    isPolling,
    fetchTotems,
    fetchPlaylist,
    handleSave,
    handleCreate,
    handleDelete,
    toggleBlockScreenSaver,
    toggleStatus,
  };
}
