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

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
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
    throw new Error(message);
  }

  return response.json();
}
