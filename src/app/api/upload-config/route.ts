import { NextResponse } from "next/server";

// Este endpoint devuelve la configuración necesaria para subir
// archivos directamente al backend, evitando el límite de body
// de las funciones serverless de Netlify (~6MB)
export async function GET() {
  const MEDIA_URL = process.env.MEDIA_URL;
  const API_KEY = process.env.API_KEY;

  if (!MEDIA_URL || !API_KEY) {
    return NextResponse.json({ error: "Configuración faltante" }, { status: 500 });
  }

  // Normalizamos la URL base
  const baseUrl = MEDIA_URL.replace(/\/api\/?$/, "");

  return NextResponse.json({
    uploadUrl: `${baseUrl}/api/videos`,
    apiKey: API_KEY,
  });
}
