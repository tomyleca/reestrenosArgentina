# Cartelera Cine Argentino — Backend & Scraper

Sistema compuesto por una API serverless (Vercel) para visualizar la cartelera y un scraper automatizado (GitHub Actions) que obtiene, enriquece con TMDB y persiste datos en PostgreSQL (Neon).

## Descripción

El proyecto está dividido en dos partes principales:

1. **API Serverless**: Sirve los datos de la base de datos PostgreSQL a través de Endpoints REST usando Express. Está diseñado para ejecutarse en [Vercel](https://vercel.com/) como Serverless Functions.
2. **Scraper Standalone**: Un script de Node.js que se ejecuta periódicamente (vía GitHub Actions). Usa Playwright para extraer la cartelera de los cines y la API de TMDB para enriquecer los datos antes de guardarlos.

### Flujo de Obtención de Datos

El scrapper obtiene las películas en cartelera para cada cine configurado. Cada cine puede tener dos estrategias de obtención:

- **API-first con fallback a scraper**: Se consulta la API pública del cine. Si falla, se activa el scraping con Playwright como respaldo (ej: Cinemark, Cine Pixel, CEA).
- **Solo scraper**: Para cines que no exponen una API pública de cartelera activa (ej: Cinepolis, Malba, Sala Lugones, Casa PBA, Centro Cultural Munro, Cine York).

### Directorios

```
src/
├── index.ts                    # Entry point de la API (Handler para Vercel)
├── actualizarCartelera.ts      # Entry point standalone del Scraper
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
├── api/                        # Controladores y rutas de la API pública
│   ├── peliculaController.ts
│   └── peliculaRouter.ts
├── adapters/
│   ├── tmdb.ts                 # Cliente HTTP de TMDB
│   ├── tmdbAdapter.ts          # Orquesta búsqueda y enriquecimiento
│   └── desambiguadores/        # Implementaciones del patrón Strategy para desambiguar candidatos
│       ├── desambiguadorHeuristico.ts
│       ├── desambiguadorIA.ts
│       └── desambiguadorHibrido.ts
├── services/
│   └── peliculaService.ts      # Orquesta el flujo completo
├── repositories/
│   └── carteleraRepository.ts  # Implementación con Prisma
└── lib/
    └── db.ts                   # Instancia singleton de PrismaClient
```

## Decisiones de diseño

### IDesambiguadorPelicula (Patrón Strategy)

Abstracción que desacopla el cliente de metadatos (`TMDB`) del mecanismo de selección y desempate de candidatos. Soporta tres estrategias:
- **`DesambiguadorHeuristico`**: Algoritmo tradicional basado en similitud de títulos, fecha de release y popularidad.
- **`DesambiguadorIA`**: Evaluación por LLM (Gemini Flash) basada en contexto rico (`ciclo`, `director`, `textoRaw`).
- **`DesambiguadorHibrido`**: Estrategia híbrida que invoca la IA cuando hay metadatos contextuales del cine y realiza fallback automático al desambiguador heurístico si es necesario.

### ICineProvider

Abstracción que desacopla `PeliculaService` del mecanismo concreto de obtención de datos. El service solo llama `provider.obtenerPeliculas()` — no sabe si hay una API, un scraper o ambos.

### pageFactory lazy

El `BrowserContext` de Playwright se crea **solo si algún provider necesita el fallback**. Si todas las APIs responden correctamente, el browser nunca se abre. Cada llamada a `pageFactory()` devuelve una nueva `Page` dentro del mismo contexto compartido.

### Fusión de películas

Los providers devuelven una entrada por función, por lo que la misma película llega repetida. Antes de guardar, `PeliculaService` las junta por `tmdbId` con `fusionarPeliculas` (dominio), uniendo cines y funciones. Cada `Funcion` pertenece a un cine (`cineId`) y es única por película + cine + fecha: dos cines pueden pasar la misma película el mismo día.

### Cartelera por cine (dos reglas)

Cada cine en `cinesConfig` declara `tieneFunciones`:
- **`true`** (Malba, Sala Lugones, Casa PBA, CEA, Munro, York): la película está en cartelera en ese cine si tiene alguna función **de hoy en adelante** ahí.
- **`false`** (Cinemark, Cinépolis, Pixel): la película está en cartelera si apareció en el **último scraping exitoso** del cine (relación `Cine.peliculas`).

No hay columna `activa`: la disponibilidad se calcula al consultar. La API devuelve solo las funciones de hoy en adelante y, en `cines`, solo los cines donde la película está disponible.

**Escritura:** cada cine es dueño de su cartelera. Si su scraping salió bien, `reemplazarCarteleraDeCine` reemplaza en una transacción sus películas y sus funciones y guarda `Cine.ultimaActualizacion`. Si falló, **no se toca**: sigue mostrando lo de la corrida anterior (un cine con funciones se va "apagando" a medida que pasan sus funciones) y `ultimaActualizacion` deja ver hace cuánto no se actualiza. Cuenta como falla:
- que el provider tire error,
- que no se obtenga ninguna película,
- que un cine con `tieneFunciones: true` traiga películas pero ninguna fecha (selector de fecha roto).

Cada falla se registra en la tabla `Alerta`.

### Identidad de una película: tmdbId

La película se identifica solo por su `tmdbId` (`upsert` por `tmdbId` en el repositorio). El `titulo` no es único: remakes y homónimas comparten título (ej. *Nosferatu* 1922 y 2024), y buscarlas por título hacía que una pisara a la otra.

### Recálculo de categoría

La categoría (`ESTRENOS` / `REESTRENOS`) depende de la fecha actual: es reestreno si pasó más de un año desde el lanzamiento. Por eso `TMDBAdapter` la recalcula en cada corrida para las películas que ya existen en la DB, en lugar de conservar la que se guardó al crearlas. Las películas sin `fechaLanzamiento` conservan la categoría guardada.

### Cachés de TMDB por corrida

`TMDBAdapter` cachea en memoria durante cada refresco:
- **Búsqueda**: clave `cineId|título` → `tmdbId` (también cachea `null`), para no repetir la búsqueda ni la llamada a Gemini por cada función de la misma película.
- **Detalle**: `tmdbId` → detalle de TMDB, para películas nuevas que aparecen en varios cines o funciones.

### Fechas en hora de Argentina

GitHub Actions y Vercel corren en UTC, así que ninguna fecha depende de la zona horaria del servidor. `utils/fechasArgentina.ts` centraliza la conversión (Argentina es UTC-3 todo el año, sin horario de verano):
- `fechaArgentina(anio, mes, dia, hora?, minuto?)`: instante de una fecha/hora de Argentina.
- `calendarioArgentina(instante)`: día de calendario en Argentina de un instante.

`Funcion.fecha` es un instante (`DateTime`). Mientras los scrapers no traigan el horario, se guarda a las 00:00 de Argentina del día de la función; cuando lo traigan, basta con pasar la hora a `fechaArgentina`. El filtro `?periodo=` del endpoint de reestrenos arma sus rangos con el día de Argentina (`[00:00 de hoy, 00:00 del día siguiente al último)`).

### Arquitectura Serverless (Vercel + GitHub Actions)

- **API Liviana**: Al remover el cron y Playwright del servidor de Express, la API se convierte en un proceso muy liviano que puede arrancar rápidamente (cold starts de ~200ms) en Vercel, evitando costos de hosting continuo.
- **Scraping sin Tiempos de Espera (Timeouts)**: Los procesos de serverless suelen tener límites de tiempo cortos de ejecución (ej: 10 a 60 segundos). El scraping a veces demora minutos, por eso se decidio su ejecución en **GitHub Actions**, lo cual además es totalmente gratis.

## API Endpoints

### Públicos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/peliculas/estrenos` | Obtiene películas en cartelera de estrenos (paginado). |
| `GET` | `/peliculas/reestrenos` | Obtiene películas en cartelera de reestrenos (paginado). Soporta `?periodo=hoy\|semana\|mes`, `?cineId=<id>` y `?localidad=<Localidad>`. El período solo aplica a cines con funciones. |
| `GET` | `/peliculas/:id` | Obtiene el detalle de una película por ID (con sus funciones de hoy en adelante). |
| `GET` | `/cines` | Devuelve la lista de todos los cines (ordenados por nombre), con `tieneFunciones` y `ultimaActualizacion`. |

## Scheduler

El scraper se ejecuta automáticamente todos los **jueves a las 17:00 (ART)** mediante un Workflow de **GitHub Actions** (`.github/workflows/scraper.yml`).

Si se requiere refrescar la cartelera manualmente, se puede lanzar el workflow desde la pestaña **Actions** en GitHub usando *Workflow Dispatch*.

## Tests

```bash
# Tests unitarios (excluye integración)
npm test

# Ejecutar TODOS los tests de integración (*.integration.test.ts)
npm run test:integration

# Ejecutar un test de integración específico
npx vitest run --config vitest.integration.config.ts tests/cinepolis/cinepolisScrapper.integration.test.ts
```

> [!IMPORTANT]
> Los tests de integración que usen la API key de TMDB o scraping deben estar marcados como `.integration.test.ts` (configurado en `vitest.integration.config.ts`) y son excluidos del run unitario general (`npm test`) para cuidar el rate limit de la API y evitar ejecuciones pesadas innecesarias.


## Stack

- **API Runtime**: Node.js + Express (Serverless for Vercel)
- **Scraping**: Playwright Chromium (sobre GitHub Actions)
- **DB ORM**: Prisma + PostgreSQL (vía Neon). `prisma.config.ts` (usado por `prisma migrate`) toma `DIRECT_URL` si existe (conexión directa sin `-pooler`) o si no `DATABASE_URL`, y le agrega `connect_timeout=30` para tolerar que Neon tarde en despertar la base suspendida (evita el error P1001 en GitHub Actions).
- **Datos de películas**: TMDB API
- **Tests**: Vitest
