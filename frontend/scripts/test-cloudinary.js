const cloudinary = require("cloudinary").v2;
require("dotenv").config({ path: ".env.local" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testCloudinary() {
  console.log("🔍 Probando conexión a Cloudinary...");
  console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error("❌ CLOUDINARY_CLOUD_NAME no está definido en .env.local");
    return;
  }

  try {
    const result = await cloudinary.api.ping();
    console.log("✅ Conexión exitosa a Cloudinary:", result);

    const folderName = "agregadorCines";
    const expression = `folder:${folderName}/*`;
    console.log(`\n📂 Buscando con expresión: '${expression}'...`);
    
    const resources = await cloudinary.search
      .expression(expression)
      .sort_by("created_at", "desc")
      .execute();

    if (!resources.resources || resources.resources.length === 0) {
      console.log(`⚠️ No se encontraron imágenes en la carpeta '${folderName}/'.`);
      console.log(`💡 Asegurate de que la carpeta se llame exactamente '${folderName}' (es case-sensitive).`);
      
      console.log("\n🔎 Buscando últimas 5 imágenes en TODA la cuenta para ayudarte a encontrarlas:");
      const lastImages = await cloudinary.api.resources({ type: "upload", max_results: 5 });
      if (lastImages.resources.length > 0) {
        lastImages.resources.forEach(r => {
          console.log(`   - [PublicId: ${r.public_id}] -> ${r.secure_url}`);
        });
      } else {
        console.log("   ❌ No se encontraron imágenes en toda la cuenta.");
      }
    } else {
      console.log(`✨ Se encontraron ${resources.resources.length} imágenes:`);
      resources.resources.forEach((r, i) => {
        console.log(`   ${i + 1}. [${r.public_id}] -> ${r.secure_url}`);
      });
    }
  } catch (error) {
    console.error("❌ Error conectando a Cloudinary:");
    console.error(error.message || error);
  }
}

testCloudinary();
