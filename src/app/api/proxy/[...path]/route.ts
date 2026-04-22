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
      // Para la API de videos, usamos la URL especial con /api
      targetUrl = `${MEDIA_URL}/api${endpoint}`;
    } else if (isUploads) {
      // Para los archivos multimedia (mp4), usamos la raíz del servidor
      targetUrl = `${MEDIA_URL}${endpoint}`;
    } else {
      // Para el resto (Tótems, Empresas, Login), usamos el API_URL por defecto
      targetUrl = `${API_URL}${endpoint}`;
    }

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
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-ignore
      duplex: 'half',
      cache: 'no-store'
    });

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
    console.error("Proxy Critical Error:", error);
    return NextResponse.json({ 
      error: "Error en la comunicación con la API",
      message: error.message
    }, { status: 502 });
  }
}
