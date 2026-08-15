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

# Ejecutar TODOS los tests de integración (*.integration.test.ts)
npm run test:integration

# Ejecutar un test de integración específico
npx vitest run --config vitest.integration.config.ts tests/casaPBA/casaPBA.integration.test.ts
```

> [!IMPORTANT]
> Los tests que consumen la API de TMDB o scrapping web deben estar marcados con la extensión `.integration.test.ts`. Estos tests están excluidos de la ejecución general unitaria (`npm test`). Se puede usar `npm run test:integration` para correr la totalidad de los tests de integración o ejecutarlos de forma individual especificado la ruta exacta del archivo.

