import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 3000,
});

/**
 * Trae todas las imágenes de una carpeta específica de Cloudinary.
 * IMPORTANTE: Requiere que las variables de entorno estén configuradas.
 */
export async function getCloudinaryFolderImages(folderName: string): Promise<string[]> {
  console.log(`[Cloudinary] Buscando imágenes en carpeta UI: ${folderName}`);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn("⚠️ Cloudinary credentials not found in env.local.");
    return [];
  }

  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Timeout al conectar con Cloudinary (3s)"));
    }, 3000);
  });

  try {
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

    const result = await Promise.race([searchPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error("❌ Error en Cloudinary Search:", error);
    return [];
  }
}
