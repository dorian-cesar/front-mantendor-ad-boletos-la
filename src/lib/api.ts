const BASE_URL = "/api/proxy";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...((options.headers || {}) as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        cache: "no-store", // Bypass browser cache entirely
        ...options,
        headers,
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          const hadToken = !!localStorage.getItem("token");
          localStorage.removeItem("token");
          // Only redirect if a session existed (token expired). During login, let the error bubble up.
          if (hadToken) {
            window.location.href = "/login";
          }
        }
        const text = await response.text().catch(() => "");
        let message = "Credenciales incorrectas. Por favor, verifique su correo y contraseña.";
        try {
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } catch { /* use default */ }
        const authError = new Error(message);
        (authError as any).status = 401;
        throw authError;
      }

      // Si es un error temporal (ej. proxy caído o red inestable), lanzamos error para forzar reintento
      if (response.status >= 500 && response.status <= 504) {
        throw new Error(`Error del servidor (${response.status})`);
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "No response body");
        console.error(`[API Error] ${response.status} ${endpoint}:`, text);
        
        let message = "API Error";
        try {
            const json = JSON.parse(text);
            message = json.message || json.error || message;
        } catch {
            message = `Error ${response.status}: ${text.substring(0, 50)}...`;
        }
        
        // Errores 4xx (como 400 Bad Request o 404) no se reintentan porque son errores del cliente
        const clientError = new Error(message);
        (clientError as any).status = response.status;
        throw clientError;
      }

      return await response.json();

    } catch (err: any) {
      lastError = err;
      
      // Solo reintentamos si es un error de conexión pura (TypeError de fetch) o un error de proxy/gateway (50x)
      const isNetworkError = err.name === "TypeError" || err.message.includes("fetch failed") || err.message.includes("temporal de red") || err.message.includes("Error del servidor");
      
      // No reintentamos errores de cliente (400, 404, etc.)
      const isClientError = err.status && err.status >= 400 && err.status < 500;

      // Por seguridad, es mejor reintentar siempre GET. Para otros métodos, lo reintentaremos si es claramente un fallo de red.
      const isSafeMethod = !options.method || options.method.toUpperCase() === "GET";

      if (attempt < maxRetries && isNetworkError && !isClientError) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500; 
        console.warn(`[Red Inestable] Fallo en ${endpoint}. Reintentando en ${Math.round(delay)}ms... (Intento ${attempt + 1} de ${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Si superamos los reintentos o no era un error reintentable, lanzamos el error original
      throw lastError;
    }
  }
}
