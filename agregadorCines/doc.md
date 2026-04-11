# Cartelera Cine Argentino — Scrapper

Servicio que recopila la cartelera de cines argentinos, la enriquece con datos de TMDB y la persiste en una base de datos PostgreSQL.

## Descripción

El scrapper obtiene las películas en cartelera para cada cine configurado. Cada cine puede tener dos estrategias de obtención:

- **API-first con fallback a scraper**: Se consulta la API pública del cine. Si falla, se activa el scraping con Playwright como respaldo (ej: Cinemark, Cinépolis).
- **Solo scraper**: Para cines que no exponen una API pública (ej: Malba, Sala Lugones, Casa PBA, Pixel).

Luego de obtener los títulos, se consulta la API de TMDB para enriquecer cada película con descripción, géneros, póster, duración y fecha de lanzamiento. Finalmente se persiste en la base de datos mediante Prisma.

### Directorios

```
src/
├── index.ts                    # Entry point: cron + HTTP server
├── config/
│   ├── cinesConfig.ts          # Datos de cada cine (URL, localidad, selectores)
│   ├── providerRegistry.ts     # Mapeo nombre → factory de ICineProvider
│   └── selectors.json          # Selectores CSS para scraping
├── core/
│   ├── domain/                 # Entidades y lógica de dominio
├── provider/
│   ├── ICineProvider.ts        # Interfaz unificadora de obtención de películas
│   ├── mappers/                # Mappers de API a PeliculaInput
│   └── scrappers/              # Implementaciones de Playwright
│       ├── cinemarkScrapper.ts
│       ├── cinepolisScrapper.ts
│       ├── cineCasaPBAScrapper.ts
│       ├── cineMalbaScrapper.ts
│       ├── cinePixelScrapper.ts
│       └── cineSalaLugonesScrapper.ts
├── api/                        # Controladores y rutas de la API pública
│   ├── peliculaController.ts
│   └── peliculaRouter.ts
├── adapters/
│   ├── tmdb.ts                 # Cliente HTTP de TMDB
│   └── tmdbAdapter.ts          # Orquesta búsqueda y enriquecimiento
├── services/
│   └── peliculaService.ts      # Orquesta el flujo completo
├── repositories/
│   └── carteleraRepository.ts  # Implementación con Prisma
└── lib/
    └── db.ts                   # Instancia singleton de PrismaClient
```

## Decisiones de diseño

### ICineProvider

Abstracción que desacopla `PeliculaService` del mecanismo concreto de obtención de datos. El service solo llama `provider.obtenerPeliculas()` — no sabe si hay una API, un scraper o ambos.

### pageFactory lazy

El `BrowserContext` de Playwright se crea **solo si algún provider necesita el fallback**. Si todas las APIs responden correctamente, el browser nunca se abre. Cada llamada a `pageFactory()` devuelve una nueva `Page` dentro del mismo contexto compartido.

### CineApiRequester genérico

La lógica de `fetch → json → mapper` es común a todas las APIs. El mapper, inyectado como dependencia, recibe `(data: T, cine: Cine)` para poder construir el `PeliculaInput` completo. Los mappers viven en archivos separados (`provider/mappers/`).

## API Endpoints

### Públicos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/peliculas/estrenos` | Obtiene películas en cartelera de estrenos (paginado). |
| `GET` | `/peliculas/reestrenos` | Obtiene películas en cartelera de reestrenos (paginado). Soporta `?periodo=hoy\|semana\|mes` y `?cineId=<id>`. |
| `GET` | `/peliculas/:id` | Obtiene el detalle de una película por ID. |
| `GET` | `/cines` | Devuelve la lista de todos los cines en la base de datos (ordenados por nombre). |

### Internos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/refresh` | Fuerza un refresco de la cartelera. Requiere `Authorization: Bearer <REFRESH_SECRET>`. |

### providerRegistry

Mapea el nombre del cine a una factory `(cine, pageFactory) => ICineProvider`. Es la única pieza que conoce qué implementación concreta usar para cada cine. Agregar un nuevo cine requiere solo agregar una entrada al registry y su mapper/scraper correspondiente.


## Scheduler

Se ejecuta automáticamente todos los **jueves a las 17:00 (ART)**.

## Tests

```bash
# Tests unitarios (excluye integración)
npm test

# Tests de integración (requieren red y credenciales)
# Se deben correr individualmente para no saturar la API de TMDB
npx vitest run --config vitest.integration.config.ts tests/cinepolisScrapper.integration.test.ts
```

> [!IMPORTANT]
> Los tests de integración que usen la API key de TMDB deben estar marcados como `.integration.test.ts` (o similar configurado en `vitest.integration.config.ts`) y son excluidos del run general para cuidar el rate limit de la API.

## Stack

- **Runtime**: Node.js + TypeScript (ESM)
- **Scraping**: Playwright (Chromium)
- **DB ORM**: Prisma + PostgreSQL
- **Scheduler**: node-cron
- **Datos de películas**: TMDB API
- **Tests**: Vitest
