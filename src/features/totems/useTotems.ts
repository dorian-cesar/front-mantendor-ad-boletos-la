import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

export function useTotems() {
  const [totems, setTotems] = useState<any[]>([]);
  const [resumenGlobal, setResumenGlobal] = useState<any>({ total_transacciones: 0, boletos_vendidos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  // Tracks which totem IDs have a pending local status change.
  // The polling skips overwriting 'status' for these IDs for 10 seconds.
  const pendingStatusRef = useRef<Map<string, number>>(new Map());

  const loadTotemsData = async () => {
    const data = await apiFetch("/totems");
    const totemList = Array.isArray(data) ? data : (data.totems || []);
    
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

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const totemsWithData = await Promise.all(
      totemList.map(async (totem: any) => {
        let playlist: any[] = [];
        try {
          const res = await fetch(`/api/proxy/totems/${totem.id}/playlist`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            const playlistData = await res.json();
            playlist = [...(playlistData.playlist || [])].sort(
              (a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)
            );
          }
        } catch { /* silencioso */ }

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
    
    return totemsWithData;
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

  const fetchPlaylist = async (totemId: string): Promise<any[]> => {
    try {
      const data = await apiFetch(`/totems/${totemId}/playlist`);
      return data.playlist || [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchTotems();
  }, []);

  const handleSave = async (id: string, editForm: any) => {
    try {
      setIsSaving(true);

      // IDs deseados como enteros simples (formato del Swagger)
      const desiredIds: number[] = (editForm.video_ids || []).map((vId: any) =>
        typeof vId === 'object' ? Number(vId.id) : Number(vId)
      ).filter((n: number) => !isNaN(n));

      // IDs actuales del tótem
      const currentTotem = totems.find(t => String(t.id) === String(id));
      const currentIds: number[] = (
        currentTotem?.playlist?.map((v: any) => Number(v.id)) ||
        currentTotem?.videos?.map((v: any) => Number(v.id)) ||
        currentTotem?.video_ids?.map((v: any) => Number(v)) ||
        []
      );

      // Calcular diferencias
      const videosToAdd = desiredIds.filter(dId => !currentIds.includes(dId));
      const videosToRemove = currentIds.filter(cId => !desiredIds.includes(cId));

      console.log(">>> Guardando tótem", id);
      console.log("   Actuales:", currentIds, "→ Deseados:", desiredIds);
      console.log("   Agregar:", videosToAdd, "| Quitar:", videosToRemove);

      // 1. POST /totems/{id}/videos - Agregar videos nuevos
      if (videosToAdd.length > 0) {
        console.log(">>> [1] POST /totems/{id}/videos:", { video_ids: videosToAdd });
        await apiFetch(`/totems/${id}/videos`, {
          method: "POST",
          body: JSON.stringify({ video_ids: videosToAdd }),
        });
        console.log("   ✅ Videos agregados");
      }

      // 2. DELETE /totems/{id}/videos/{videoId} - Quitar videos removidos
      for (const videoId of videosToRemove) {
        console.log(`>>> [2] DELETE /totems/{id}/videos/${videoId}`);
        try {
          await apiFetch(`/totems/${id}/videos/${videoId}`, { method: "DELETE" });
          console.log(`   ✅ Video ${videoId} removido`);
        } catch {
          console.warn(`   ⚠️ No se pudo quitar video ${videoId}`);
        }
      }

      // 3. PUT /totems/{id} - Solo datos básicos (sin status ni video_ids para evitar conflictos)
      // NOTA: No enviamos 'status' aquí porque el backend lo vincula con is_online.
      // El status (Activo/Inactivo como habilitación) se gestiona con toggleStatus por separado.
      const putPayload = {
        identificador: editForm.identificador,
        direccion: editForm.direccion,
        latitud: editForm.latitud || 0,
        longitud: editForm.longitud || 0,
      };

      console.log(">>> [3] PUT /totems/{id}:", putPayload);
      await apiFetch(`/totems/${id}`, {
        method: "PUT",
        body: JSON.stringify(putPayload),
      });
      console.log("   ✅ Tótem actualizado");

      // 4. PATCH /totems/{id} - Enviar video_ids en el ORDEN deseado
      //    El backend debería respetar el orden del array para la tabla totem_videos
      if (desiredIds.length > 0) {
        const patchPayload = { video_ids: desiredIds };
        console.log(">>> [4] PATCH /totems/{id}:", patchPayload);
        try {
          await apiFetch(`/totems/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patchPayload),
          });
          console.log("   ✅ Orden de playlist actualizado vía PATCH");
        } catch (patchError) {
          console.warn("   ⚠️ PATCH falló, intentando con PUT + video_ids:", patchError);
          // Fallback: intentar PUT con video_ids
          try {
            await apiFetch(`/totems/${id}`, {
              method: "PUT",
              body: JSON.stringify({ ...putPayload, video_ids: desiredIds }),
            });
            console.log("   ✅ Orden actualizado vía PUT fallback");
          } catch (putError) {
            console.warn("   ⚠️ PUT fallback también falló:", putError);
          }
        }
      }

      // 5. POST /videos/reorder - Persistir el campo 'orden' en la tabla videos
      if (desiredIds.length > 0) {
        const reorderPayload = {
          videos: desiredIds.map((videoId, index) => ({
            id: videoId,
            orden: index + 1,
          })),
        };
        console.log(">>> [5] POST /videos/reorder:", reorderPayload);
        try {
          await apiFetch("/videos/reorder", {
            method: "POST",
            body: JSON.stringify(reorderPayload),
          });
          console.log("   ✅ Orden global de videos actualizado");
        } catch (reorderError) {
          console.warn("   ⚠️ No se pudo actualizar el orden global:", reorderError);
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

  const handleCreate = async (createForm: any) => {
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
    
    // Mark this totem as having a pending status change for 10 seconds
    // so the polling doesn't immediately revert our optimistic update.
    pendingStatusRef.current.set(String(id), Date.now())

    // Optimistic local update
    setTotems((prev) => 
      prev.map(t => String(t.id) === String(id) ? { ...t, status: newStatus } : t)
    );

    try {
      await apiFetch(`/totems/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      // Revert on error
      pendingStatusRef.current.delete(String(id))
      setTotems((prev) => 
        prev.map(t => String(t.id) === String(id) ? { ...t, status: currentStatus } : t)
      );
      alert("Error al cambiar el estado del tótem");
    }
  };

  const toggleBlockScreenSaver = async (id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Actualización optimista local
    setTotems((prev) => 
      prev.map(t => String(t.id) === String(id) ? { ...t, block_screen_saver: newValue } : t)
    );

    try {
      await apiFetch(`/totems/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ block_screen_saver: newValue }),
      });
    } catch (error) {
      console.error("Error toggling block_screen_saver:", error);
      // Revertir en caso de error
      setTotems((prev) => 
        prev.map(t => String(t.id) === String(id) ? { ...t, block_screen_saver: currentValue } : t)
      );
      alert("Error al actualizar la configuración del protector de pantalla");
    }
  };

  // Efecto para auto-refrescar las métricas/telemetría en segundo plano cada 15 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsPolling(true);
        const metricsData = await apiFetch("/totems/metrics");
        if (!Array.isArray(metricsData)) return;

        const PENDING_TTL = 10_000;
        setTotems(currentTotems => {
          return currentTotems.map(current => {
            const freshMetric = metricsData.find(m => String(m.id) === String(current.id));
            if (!freshMetric) return current;

            const pendingTs = pendingStatusRef.current.get(String(current.id));
            const hasPendingStatus = pendingTs && (Date.now() - pendingTs < PENDING_TTL);
            if (!hasPendingStatus) {
              pendingStatusRef.current.delete(String(current.id));
            }

            return {
              ...current,
              is_online: freshMetric.is_online,
              ultimo_login: freshMetric.last_ping || freshMetric.ultimo_login || current.ultimo_login,
              ultima_telemetria: freshMetric.ultima_telemetria,
              ultimo_error_critico: freshMetric.ultimo_error_critico,
              // Mantener el status local si hay una actualización optimista pendiente
              ...(hasPendingStatus ? {} : { status: freshMetric.status })
            };
          });
        });
      } catch (err: any) {
        if (err.message && err.message.includes("404")) {
          // Silencioso: El backend posiblemente aún no implementa esta ruta o hay un conflicto de rutas
        } else if (err.message && err.message.includes("Totem no encontrado")) {
          // Silencioso: Conflicto de rutas en el backend (interpreta 'metrics' como ID)
        } else {
          console.warn("Error en el refresco automático de métricas en segundo plano:", err);
        }
      } finally {
        // Un pequeño retraso para evitar parpadeos bruscos en la UI
        setTimeout(() => setIsPolling(false), 800);
      }
    }, 15_000); // Refresco cada 15 segundos

    return () => clearInterval(interval);
  }, []);

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
