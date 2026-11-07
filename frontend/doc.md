# Cartelera Cine Argentino — Frontend

Interfaz web para visualizar la cartelera de cines argentinos. Construida con **Next.js 15**, **React 19** y **TypeScript**.

## Características

- **Visualización de Reestrenos**: Grilla infinita con scroll infinito (IntersectionObserver).
- **Filtros interactivos**: Por zona/localidad (CABA, Zona Norte, Zona Sur, Zona Oeste, Zona Este con indicador de próximamente para zonas sin cines), por uno o varios cines y un **Orden** (**Popularidad**, por defecto, o **Próxima función**), con confirmación mediante el botón **Aplicar**. En pantallas chicas (debajo de `md`) el panel arranca oculto y se despliega con el botón **Filtros**, que muestra cuántos filtros hay aplicados; al tocar **Aplicar** el panel se cierra. En `md+` los filtros están siempre visibles.
- **Funciones**: cada tarjeta muestra la próxima función ("Próxima: jue 30/10 · Malba"). El modal y la página de detalle muestran, por cine, todas sus funciones de hoy en adelante; para los cines sin funciones (Cinemark, Cinépolis, Pixel) se enlaza al sitio del cine. Las fechas se muestran siempre en hora de Argentina (`utils/fechas.ts`); si una función no tiene horario (00:00) se muestra solo el día.
- **Última actualización por cine**: cada cine muestra hace cuánto se actualizó su cartelera ("Actualizado hace 3 días"). Pasados 8 días se marca como posiblemente desactualizado (el refresco es semanal y un cine cuyo scraper falla conserva su cartelera anterior).
- **Server-Side Rendering (SSR)**: La carga inicial se realiza en el servidor para mejorar el SEO y la velocidad.
- **Integración con Cloudinary**: Imágenes dinámicas para el Hero Carousel.
- **Diseño Moderno**: Uso de CSS Modules y TailwindCSS para un estilo limpio y mantenible.

## Stack Tecnológico

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Librería UI**: [React 19](https://react.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: Vanilla CSS + [CSS Modules](https://github.com/css-modules/css-modules)
- **Gestión de Imágenes**: [Cloudinary](https://cloudinary.com/)

## Estructura del Proyecto

```
src/
├── app/                # Rutas y páginas (App Router)
│   ├── layout.tsx      # Layout global (Navbar, Footer, etc.)
│   ├── page.tsx        # Página principal (Home): solo reestrenos
│   └── page.module.css # Estilos de la home
├── components/         # Componentes de UI reutilizables
│   ├── GrillaReestrenos/  # Grilla con scroll infinito + filtros (componente principal) y BotonFiltros (despliegue en mobile)
│   ├── Pelicula/          # PeliculaCard, PeliculaModal y DisponibilidadCines (cines + funciones)
│   └── HeroCarousel/
├── hooks/              # Custom hooks de React
│   └── usePeliculasPaginadas.ts  # Paginación con soporte de período, cineId y localidad; cada carga cancela la anterior (AbortController)
├── services/           # Llamadas a APIs externas
│   ├── peliculaService.ts   # Conexión con el Backend (incluye getCines)
│   └── cloudinaryService.ts # Conexión con Cloudinary
├── types/              # Definiciones de TypeScript (Interfaces y Enums)
└── utils/
    └── fechas.ts       # Formato de funciones y "última actualización" en hora de Argentina
```

## Caché

La cartelera cambia con cada scraping, no en tiempo real, así que el servidor de Next no consulta la API en cada visita:

- **Películas y cines** (`peliculaService`): los `fetch` usan `next: { revalidate: 3600 }`. La home y el sitemap quedan estáticos y se regeneran como mucho una vez por hora; Vercel los sirve desde el CDN. En el navegador (filtros, scroll infinito) esa opción se ignora y los pedidos van directo a la API.
- **Fotos del hero** (`cloudinaryService`): la lista de URLs se guarda un día con `unstable_cache`. Los errores no se cachean: si Cloudinary falla, se usan las fotos de fallback y el próximo render vuelve a intentar.

Consecuencias:
- Después de un refresco, la cartelera nueva puede tardar hasta una hora en verse.
- **Nunca se guarda una home o un sitemap vacíos.** `page.tsx` y `sitemap.ts` no atrapan los errores de la API a propósito:
  - Si la API falla durante el **build**, el build falla y Vercel sigue sirviendo el deploy anterior. Hay que relanzar el deploy cuando la API vuelva.
  - Si falla al **regenerar** (cada hora), Next sigue sirviendo la última versión buena y reintenta en la próxima visita.
- El build reutiliza las respuestas de `.next/cache/fetch-cache` mientras no venzan: para probar localmente el caso "API caída" hay que borrar esa carpeta.

## Requisitos Previos

- **Node.js**: v18 o superior.
- **Backend Activo**: El servicio `agregadorCines` debe estar corriendo (por defecto en `http://localhost:3000`), también durante `npm run build`.

## Variables de Entorno

Crea un archivo `.env.local` en la raíz de la carpeta `frontend`:

```env
# URL del backend (agregadorCines)
NEXT_PUBLIC_API_URL=http://localhost:3000



## Desarrollo

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abre [http://localhost:3001](http://localhost:3001) (o el puerto que asigne Next.js)

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Crea la versión de producción optimizada.
- `npm run start`: Inicia el servidor de producción.
- `npm run lint`: Ejecuta el linter (ESLint).
