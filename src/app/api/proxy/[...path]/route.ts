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

    if (!API_URL || !API_KEY) {
      return NextResponse.json({ 
        error: "Configuración faltante",
        debug: { hasUrl: !!API_URL, hasKey: !!API_KEY }
      }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;
    const targetUrl = `${API_URL}${endpoint}`;

    // Forwarding specific headers to ensure clean communication
    const headers = new Headers();
    ['content-type', 'authorization', 'accept'].forEach(h => {
      const val = request.headers.get(h);
      if (val) headers.set(h, val);
    });

    // Inyectar API KEY de forma privada
    headers.set("x-api-key", API_KEY);

    // Proxy the request using streaming
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-ignore
      duplex: 'half'
    });

    // Return the response as a stream (minimizes TTFB)
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store, max-age=0"
      },
    });

  } catch (error: any) {
    console.error("Proxy Critical Error:", error);
    return NextResponse.json({ 
      error: "Error en la comunicación con la API",
      message: error.message
    }, { status: 502 });
  }
}
