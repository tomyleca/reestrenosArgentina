# Cartelera Cine Argentino — Frontend

Interfaz web para visualizar la cartelera de cines argentinos. Construida con **Next.js 15**, **React 19** y **TypeScript**.

## Características

- **Visualización de Reestrenos**: Grilla infinita con scroll infinito (IntersectionObserver).
- **Filtros interactivos**: Por período (Hoy / Esta semana / Este mes) y por cine, con confirmación mediante el botón **Aplicar**.
- **Server-Side Rendering (SSR)**: La carga inicial se realiza en el servidor para mejorar el SEO y la velocidad.
- **Integración con Cloudinary**: Imágenes dinámicas para el Hero Carousel.
- **Diseño Moderno**: Uso de CSS Modules para un estilo limpio y mantenible.

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
│   ├── CarruselPeliculas/ # Componente legacy (PeliculaCard, PeliculaModal)
│   └── HeroCarousel/
├── hooks/              # Custom hooks de React
│   └── usePeliculasPaginadas.ts  # Paginación con soporte de período y cineId
├── services/           # Llamadas a APIs externas
│   ├── peliculaService.ts   # Conexión con el Backend (incluye getCines)
│   └── cloudinaryService.ts # Conexión con Cloudinary
├── types/              # Definiciones de TypeScript (Interfaces y Enums)
└── mocks/              # Datos de prueba para desarrollo
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
