# Ejecutar tests

## Estructura de tests

Los tests se encuentran en la carpeta `tests/` en la raíz del proyecto.
Las capturas de pantalla generadas durante los tests se guardan en `tests/screenshots/`.

## Comandos

```bash
# Tests unitarios (excluye integración)
npm test

# Tests en modo watch (re-ejecuta al guardar cambios)
npm run test:watch

# Con interfaz gráfica
npm run test:ui

# Tests de integración (requieren red y credenciales)
# Se deben correr individualmente para cuidar el rate limit de TMDB
npx vitest run --config vitest.integration.config.ts tests/nombreDelTest.integration.test.ts
```

> [!IMPORTANT]
> Los tests que consumen la API de TMDB deben estar marcados con la extensión `.integration.test.ts`. Estos tests están excluidos de la ejecución general (`npm test`) y deben ejecutarse de forma individual para evitar alcanzar el límite de llamadas de la API key.
