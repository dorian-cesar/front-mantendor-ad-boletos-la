import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_WS_URL;

let socket: Socket | null = null;

/**
 * Devuelve el socket autenticado singleton.
 * Lo crea la primera vez (o si estaba desconectado) con el token del localStorage.
 */
export function getSocket(): Socket {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!socket || !socket.connected) {
    socket = io(BACKEND_URL, {
      auth: {
        token: token ? `Bearer ${token}` : undefined,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("✅ [WS] Conectado al servidor WebSocket como Administrador.");
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ [WS] Error de conexión (posible token inválido/expirado):", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [WS] Desconectado. Razón: ${reason}`);
    });
  }

  return socket;
}

/**
 * Desconecta y destruye el socket.
 * Llamar al hacer logout o al desmontar la app.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 [WS] Socket desconectado y liberado.");
  }
}
