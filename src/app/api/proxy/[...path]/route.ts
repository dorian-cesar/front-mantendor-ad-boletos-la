import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

async function handleRequest(request: NextRequest, path: string[]) {
  try {
    const API_URL = process.env.API_URL;
    const API_KEY = process.env.API_KEY;
    const MEDIA_URL = process.env.MEDIA_URL;

    if (!API_URL || !API_KEY || !MEDIA_URL) {
      return NextResponse.json({ 
        error: "Configuración faltante",
        debug: { hasApiUrl: !!API_URL, hasKey: !!API_KEY, hasMediaUrl: !!MEDIA_URL }
      }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;
    
    // Lógica para determinar la URL de destino
    let targetUrl: string;
    const isVideoAPI = path[0] === "videos";
    const isUploads = path[0] === "uploads";

    if (isVideoAPI) {
      targetUrl = `${MEDIA_URL}/api${endpoint}`;
    } else if (isUploads) {
      targetUrl = `${MEDIA_URL}${endpoint}`;
    } else {
      targetUrl = `${API_URL}/api${endpoint}`;
    }

    // Normalizar URL (quitar posibles dobles slashes excepto el inicial)
    targetUrl = targetUrl.replace(/([^:]\/)\/+/g, "$1");
    (global as any).lastTargetUrl = targetUrl; // Para el log del catch

    // Headers a reenviar del cliente al backend
    const headers = new Headers();
    const headersToForward = [
      'content-type', 
      'authorization', 
      'accept', 
      'range', // CRUCIAL para streaming de videos
      'if-range',
      'if-none-match'
    ];

    headersToForward.forEach(h => {
      const val = request.headers.get(h);
      if (val) headers.set(h, val);
    });

    // Inyectar API KEY de forma privada
    headers.set("x-api-key", API_KEY);

    // Petición al backend con streaming
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      cache: 'no-store'
    };

    // Manejo del Body para POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const bodyBuffer = await request.arrayBuffer();
        if (bodyBuffer.byteLength > 0) {
          fetchOptions.body = bodyBuffer;
          // @ts-ignore
          fetchOptions.duplex = 'half';
        }
      } catch (e) {
        console.warn("[Proxy] No se pudo leer el body de la petición");
      }
    };

    // Implementar un timeout de 60 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    fetchOptions.signal = controller.signal;

    let response: Response | null = null;
    let retries = 2;
    
    while (retries >= 0) {
      try {
        response = await fetch(targetUrl, fetchOptions);
        clearTimeout(timeoutId);
        break;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error(`[Proxy] TIMEOUT tras 60s en: ${targetUrl}`);
          throw new Error("El servidor backend tardó demasiado en responder (Timeout).");
        }
        if (err.name === 'AggregateError' && retries > 0) {
          console.warn(`[Proxy] Reintentando... ${targetUrl}`);
          await new Promise(r => setTimeout(r, 200));
          retries--;
        } else {
          clearTimeout(timeoutId);
          throw err;
        }
      }
    }
    
    if (!response) {
       throw new Error("Falló el fetch inesperadamente tras reintentos.");
    }

    // Headers a reenviar del backend al cliente (navegador)
    const responseHeaders = new Headers();
    const headersToReturn = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'etag',
      'last-modified'
    ];

    headersToReturn.forEach(h => {
      const val = response.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Manejo especial para 304 (Not Modified), que NO debe tener body
    if (response.status === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: responseHeaders,
      });
    }

    // Manejo de errores (el status 206 Partial Content es normal en videos)
    if (!response.ok && response.status !== 206) {
      const errorText = await response.text().catch(() => "");
      console.error(`Backend Error (${response.status}):`, errorText);
      return new NextResponse(errorText, {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Retorno de la respuesta como stream continuo
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Proxy Critical Error:", {
      message: error.message,
      cause: error.cause,
      code: error.code,
      targetUrl: (global as any).lastTargetUrl
    });
    
    return NextResponse.json({ 
      error: "Error en la comunicación con la API al obtener recurso",
      message: error.message,
      cause: error.cause ? String(error.cause) : undefined,
      code: error.code,
      targetUrl: (global as any).lastTargetUrl
    }, { status: 502 });
  }
}
