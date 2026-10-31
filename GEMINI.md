
## Llamada a api

La api key para tmdb no tiene llamadas ilimitadas, por lo que si se usa en test, estos deben estar marcados como integration y se debe tener configurado siempre que sean excluidos al correr todos los test y solo puedan ser corridos individualmente.




## React

Seguí las mejores prácticas de react para implementar la funcionalidad. Por ej.: componetizar la funcionalidad, usar hooks, etc.

## Estilos

Usá TailwindCSS para los estilos.

## Buscar en el código

Antes de buscar algo en el código fijate si no esta en el doc.md de la carpeta correspondiente.

## Documentación

Mantene el doc.md de cada carpeta actualizado.

## Migraciones de base de datos

Una migración se commitea ya aplicada en la DB local y probada. Nunca dejes migraciones sin aplicar.

- Generala con `npx prisma migrate dev --name <descripcion>` (desde `agregadorCines/`): genera el SQL y lo aplica en local en el mismo paso.
- Si hay que editar el SQL (columna obligatoria en una tabla con datos, renombres, duplicados antes de un unique, migración de datos), usá `--create-only`, editá `migration.sql` y aplicala enseguida con `npx prisma migrate dev`.
- Antes de commitear, `npx prisma migrate status` tiene que decir que la DB está al día.
- Si no podés aplicarla vos, avisá explícitamente que queda pendiente y qué datos borra o modifica.
