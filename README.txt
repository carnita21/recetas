RECETARIO A–Z — PWA

CONTENIDO
- index.html: estructura de la aplicación.
- styles.css: estilos responsivos.
- app.js: consumo de la API TheMealDB, búsqueda con el botón "Buscar", casilla en cada
  tarjeta para marcar favoritos (se guardan en el navegador), botón "Favoritos" para verlos
  y ventana de detalles (ingredientes, pasos y video) al hacer clic en una tarjeta.
- manifest.json: configuración para instalar la PWA.
- service-worker.js: caché de los archivos principales.
- icons/: iconos de la aplicación (SVG y PNG de 192 y 512 px, versiones "maskable",
  apple-touch-icon para iPhone y favicon).

API UTILIZADA (gratuita, sin clave)
- https://www.themealdb.com/api/json/v1/1/search.php?s=pasta → búsqueda por nombre
Al iniciar se hace una búsqueda vacía (search.php?s=) que devuelve recetas variadas.

CÓMO EJECUTAR EN WINDOWS
1. Descomprime recetario_pwa.zip.
2. Abre la carpeta en Visual Studio Code.
3. Instala la extensión "Live Server" si aún no la tienes.
4. Haz clic derecho en index.html y selecciona "Open with Live Server".
5. Para instalarla, abre la app desde localhost en Chrome o Edge y usa el botón
   "⬇ Descargar app" (junto a Favoritos) o el icono de instalar en la barra de direcciones.

IMPORTANTE
- Las PWA necesitan HTTPS o localhost para que funcione el Service Worker
  (abrir index.html con doble clic NO sirve para instalarla).
- La primera carga necesita internet porque las recetas e imágenes vienen de TheMealDB.
- USO SIN INTERNET: el Service Worker guarda los archivos de la app, cada búsqueda que hagas
  con internet y las fotos que se vean. Sin conexión puedes repetir esas búsquedas y ver tus
  favoritos (con foto, ingredientes y pasos). Los videos de YouTube solo funcionan con internet.
  Para que funcione en el celular, la app debe abrirse con HTTPS (por ejemplo GitHub Pages);
  desde la IP de tu PC (http://192.168...) el navegador NO activa el Service Worker.
- La API devuelve nombres e instrucciones en inglés; la interfaz está en español.
  Para buscar por nombre conviene usar palabras en inglés (chicken, beef, cake, soup...).
- Si cambias archivos y no ves los cambios, sube la versión en CACHE_NAME dentro de service-worker.js.
- Para publicar, puedes subir los archivos a GitHub Pages y activar Pages en la configuración del repositorio.
