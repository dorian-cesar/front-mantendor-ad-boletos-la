import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

async function handleRequest(request: NextRequest, path: string[]) {
  const API_URL = process.env.API_URL;
  const API_KEY = process.env.API_KEY;

  if (!API_URL || !API_KEY) {
    return NextResponse.json({ error: "API configuration missing on server" }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams.toString();
  const endpoint = `/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;
  const targetUrl = `${API_URL}${endpoint}`;

  const headers = new Headers(request.headers);
  headers.set("x-api-key", API_KEY);
  // Remove host header to avoid conflicts
  headers.delete("host");

  try {
    const body = request.method !== "GET" && request.method !== "HEAD" 
      ? await request.blob() 
      : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.blob();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Failed to communicate with backend" }, { status: 502 });
  }
}
