# Cartelera Cine Argentino — Frontend

Interfaz web para visualizar la cartelera de cines argentinos. Construida con **Next.js 15**, **React 19** y **TypeScript**.

## Características

- **Visualización de Reestrenos**: Grilla infinita con scroll infinito (IntersectionObserver).
- **Filtros interactivos**: Por zona/localidad (CABA, Zona Norte, Zona Sur, Zona Oeste, Zona Este con indicador de próximamente para zonas sin cines), por cine y por período (Hoy / Esta semana / Este mes), con confirmación mediante el botón **Aplicar**.
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
│   ├── GrillaReestrenos/  # Grilla con scroll infinito + filtros (componente principal)
│   ├── Pelicula/          # PeliculaCard, PeliculaModal y DisponibilidadCines (cines + funciones)
│   └── HeroCarousel/
├── hooks/              # Custom hooks de React
│   └── usePeliculasPaginadas.ts  # Paginación con soporte de período, cineId y localidad
├── services/           # Llamadas a APIs externas
│   ├── peliculaService.ts   # Conexión con el Backend (incluye getCines)
│   └── cloudinaryService.ts # Conexión con Cloudinary
├── types/              # Definiciones de TypeScript (Interfaces y Enums)
└── utils/
    └── fechas.ts       # Formato de funciones y "última actualización" en hora de Argentina
```

## Requisitos Previos

- **Node.js**: v18 o superior.
- **Backend Activo**: El servicio `agregadorCines` debe estar corriendo (por defecto en `http://localhost:3000`).

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
