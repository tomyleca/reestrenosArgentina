# ReestrenosArg
### https://reestrenosarg.vercel.app/

### Agregador de reestrenos de películas en cines de Argentina, tanto comerciales como independientes. 
![alt text](image.png)

## Stack
- Database: PostgreSQL + Prisma 
- Backend: Typescript + Express + Node.js 
- Frontend: React + Next.js
- Web Scrapping: Playwright

## Key Features:
- Lógica de web scrapping encapsulada en una clase, la cual permite agregar cines facilmente, solo teniendo que definir los selectores + algún comportamiento especial(como cerrar un popup).
- Integración con la API de TMDB para obtener imagenes, descripciones, géneros entre otros datos.
- Modelo de IA integrado que identifica la película en caso de que TMDB devuelva más de una.
- UI optimizada para dispositivos móviles y de escritorio con tecnologías actuales.
 
## Cines Soportados:
- Malba
- Sala Lugones
- Cinemark
- Cinépolis
- Pixel
- Casa PBA
- CEA Avellaneda
- Cine York
- Centro Cultural Munro
