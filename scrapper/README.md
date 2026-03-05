# Cartelera Cine Argentino — Scrapper

Servicio que recopila la cartelera de cines argentinos, la enriquece con datos de TMDB y la persiste en una base de datos PostgreSQL.

## Descripción

El scrapper obtiene las películas en cartelera para cada cine configurado. Cada cine puede tener dos estrategias de obtención:

- **API-first con fallback a scraper**: Se consulta la API pública del cine. Si falla, se activa el scraping con Playwright como respaldo.
- **Solo scraper**: Para cines que no exponen una API pública.

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
│   │   ├── pelicula.ts
│   │   ├── cine.ts
│   │   ├── genero.ts
│   │   ├── categoria.ts
│   │   └── localidad.ts
│   ├── dtos/
│   │   └── peliculaInput.ts    # DTO intermedio del scraping
│   └── interfaces/
│       └── IDatosPeliculaGetter.ts
├── provider/
│   ├── ICineProvider.ts        # Interfaz unificadora de obtención de películas
│   ├── ICineScrapper.ts
│   ├── apiWithFallbackProvider.ts  # API-first + scraper de fallback (lazy)
│   ├── scraperOnlyProvider.ts      # Solo scraping
│   ├── cineApiRequester.ts         # Fetch genérico a APIs de cines
│   ├── scraper.ts                  # Clase base abstracta (Template Method)
│   ├── browserContext.ts           # Configuración anti-detección de Playwright
│   ├── mappers/
│   │   ├── cinepolisMapper.ts
│   │   └── cinemarkMapper.ts
│   └── scrappers/
│       ├── cinemarkScrapper.ts
│       └── cinepolisScrapper.ts
├── adapters/
│   ├── tmdb.ts                 # Cliente HTTP de TMDB
│   └── tmdbAdapter.ts          # Orquesta búsqueda y enriquecimiento con TMDB
├── services/
│   └── peliculaService.ts      # Orquesta el flujo completo
├── repositories/
│   ├── ICarteleraRepository.ts
│   └── carteleraRepository.ts  # Implementación con Prisma
├── utils/
│   └── normalizadorPeliculas.ts
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

### providerRegistry

Mapea el nombre del cine a una factory `(cine, pageFactory) => ICineProvider`. Es la única pieza que conoce qué implementación concreta usar para cada cine. Agregar un nuevo cine requiere solo agregar una entrada al registry y su mapper/scraper correspondiente.

## Variables de entorno

| Variable         | Descripción                            |
| ---------------- | -------------------------------------- |
| `DATABASE_URL`   | URL de conexión PostgreSQL             |
| `TMDB_API_KEY`   | API key de TMDB                        |
| `REFRESH_SECRET` | Token para el endpoint HTTP `/refresh` |

## Endpoints


| `POST` | `/refresh` | Fuerza un refresco de la cartelera. 


Requiere `Authorization: Bearer <REFRESH_SECRET>` 

## Scheduler

Se ejecuta automáticamente todos los **jueves a las 17:00 (ART)**.

## Tests

```bash
# Tests unitarios (excluye integración)
npm test

# Tests de integración (requieren red y credenciales)
npx vitest run --config vitest.integration.config.ts tests/cinepolisScrapper.integration.test.ts
npx vitest run --config vitest.integration.config.ts tests/cinemarkScrapper.test.ts
```

> Los tests de integración que usen la API key de TMDB deben estar marcados como `.integration.test.ts` y son excluidos del run general.

## Stack

- **Runtime**: Node.js + TypeScript (ESM)
- **Scraping**: Playwright (Chromium)
- **DB ORM**: Prisma + PostgreSQL
- **Scheduler**: node-cron
- **Datos de películas**: TMDB API
- **Tests**: Vitest
