import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useTotems() {
  const [totems, setTotems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTotems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/totems");
      const totemList = Array.isArray(data) ? data : [];

      // Obtener playlist ordenada de cada tótem (silencioso, sin errores en consola)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const totemsWithPlaylist = await Promise.all(
        totemList.map(async (totem: any) => {
          try {
            const res = await fetch(`/api/proxy/totems/${totem.id}/playlist`, {
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
            if (res.ok) {
              const playlistData = await res.json();
              const sorted = [...(playlistData.playlist || [])].sort(
                (a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)
              );
              return { ...totem, playlist: sorted };
            }
          } catch {
            // Silencioso
          }
          return { ...totem, playlist: [] };
        })
      );

      setTotems(totemsWithPlaylist);
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

      // 3. PUT /totems/{id} - Solo datos básicos (sin video_ids para evitar FK errors)
      const putPayload = {
        identificador: editForm.identificador,
        direccion: editForm.direccion,
        latitud: editForm.latitud || 0,
        longitud: editForm.longitud || 0,
        status: editForm.status,
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
    if (!confirm("¿Está seguro de eliminar este tótem?")) return;
    try {
      await apiFetch(`/totems/${id}`, { method: "DELETE" });
      await fetchTotems();
    } catch (error) {
      console.error("Error deleting totem:", error);
      throw error;
    }
  };

  // Efecto para auto-refrescar el estado de conexión cada 30 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Hacemos un fetch ligero (solo /totems)
        const data = await apiFetch("/totems");
        const totemList = Array.isArray(data) ? data : [];
        
        // Actualizamos solo los campos de conexión en el estado actual
        // para evitar recargar playlists pesadas
        setTotems(currentTotems => 
          currentTotems.map(t => {
            const updated = totemList.find((u: any) => String(u.id) === String(t.id));
            if (updated) {
              return { 
                ...t, 
                is_online: updated.is_online,
                ultimo_login: updated.ultimo_login,
                status: updated.status
              };
            }
            return t;
          })
        );
      } catch (err) {
        console.warn("Error en el refresco automático de conexión:", err);
      }
    }, 20000); // 20 segundos

    return () => clearInterval(interval);
  }, []);

  return {
    totems,
    loading,
    error,
    isSaving,
    fetchTotems,
    fetchPlaylist,
    handleSave,
    handleCreate,
    handleDelete,
  };
}
