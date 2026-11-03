import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 3000,
});

// Las fotos del hero casi no cambian: la lista se guarda un día para no llamar
// a la Search API de Cloudinary (que tiene límite por hora) en cada render.
const REVALIDATE_SEGUNDOS = 60 * 60 * 24;

/**
 * Trae todas las imágenes de una carpeta específica de Cloudinary.
 * IMPORTANTE: Requiere que las variables de entorno estén configuradas.
 */
export async function getCloudinaryFolderImages(folderName: string): Promise<string[]> {
  // Fuera de la caché: si faltan las credenciales, al configurarlas se ve enseguida
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn("⚠️ Cloudinary credentials not found in env.local.");
    return [];
  }

  try {
    return await buscarImagenesCacheado(folderName);
  } catch (error) {
    console.error("❌ Error en Cloudinary Search:", mensajeDeError(error));
    return [];
  }
}

// unstable_cache no guarda los errores: si Cloudinary falla, se tira el error
// para que el próximo render vuelva a intentar en vez de quedar un día con [].
const buscarImagenesCacheado = unstable_cache(
  buscarImagenes,
  ["cloudinary-carpeta"],
  { revalidate: REVALIDATE_SEGUNDOS },
);

async function buscarImagenes(folderName: string): Promise<string[]> {
  console.log(`[Cloudinary] Buscando imágenes en carpeta UI: ${folderName}`);

  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Timeout al conectar con Cloudinary (3s)"));
    }, 3000);
  });

  const searchPromise = (async () => {
    // Usamos el Search API que es el que entiende las carpetas de la interfaz de usuario
    const result = await cloudinary.search
      .expression(`folder:${folderName}/*`)
      .sort_by("created_at", "desc")
      .max_results(50)
      .execute();

    const count = result.resources?.length || 0;
    console.log(`[Cloudinary] Éxito. Encontradas ${count} imágenes.`);

    if (result.resources && result.resources.length > 0) {
      return result.resources.map((resource: { secure_url: string }) => resource.secure_url);
    }

    console.log(`[Cloudinary] La carpeta '${folderName}' parece estar vacía o el nombre es incorrecto.`);
    return [];
  })();

  try {
    return await Promise.race([searchPromise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// El SDK de Cloudinary rechaza con un objeto que incluye las opciones del request,
// con la api_key y el api_secret en `auth`. Nunca hay que loguear el error completo.
function mensajeDeError(error: unknown): string {
  if (error instanceof Error) return error.message;

  const detalle = (error as { error?: { message?: string; http_code?: number } })
    ?.error;
  if (detalle?.message) {
    return detalle.http_code
      ? `${detalle.message} (HTTP ${detalle.http_code})`
      : detalle.message;
  }

  return "Error desconocido de Cloudinary";
}
