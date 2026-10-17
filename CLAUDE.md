# GymBrain — instrucciones para Claude

App de gimnasio personal de Rodrigo. PWA publicada en GitHub Pages desde este repo y usada desde el iPhone ("Agregar a pantalla de inicio"). Él entrena 3-4 veces por semana y es casi principiante.

## Cómo está armada
- Todo vive en `index.html`: CSS, JS vanilla y los datos (ejercicios, programas, logros). No hay framework ni build.
- Excepción: el mapa muscular 3D. `models/musculos.glb` (CC BY-SA 4.0, ver `models/ATTRIBUTION.txt`) y Three.js en `vendor/three/` (MIT) se cargan solo al abrir un ejercicio. La conexión ejercicio → músculo 3D está en `TGT3D`/`GROUP3D` dentro de `index.html`. Si falla WebGL queda el mapa 2D. Si agregás archivos, sumalos a `EXTRA` en `sw.js` para que anden offline.
- `index.html` pesa unos 750 KB porque trae embebidas en base64 las imágenes de anatomía (`BODY_B64`). **No leas ni reescribas esos bloques base64.** Buscá con grep la sección que necesitás y editá solo esa parte.
- Los datos se guardan en `localStorage` con claves `gb2_*` (settings, sessions, active, swaps, custom, bw, ach, missions, skips, migrated, y desde V25: goals, order, kcal, nutri, tips). `gb2_schema` guarda la versión de migración de cada dato nuevo. **Nunca cambies esas claves ni el formato de los datos sin migración:** se perdería el historial de entrenamientos. Toda clave nueva va con versión, validación al cargar y en exportar/importar.
- Peso y calorías: se premia registrar, nunca un número. Textos sin juzgar el peso ni culpa por las calorías; siempre aclarar que son estimaciones.
- `sw.js` es el service worker. **Cada vez que cambies `index.html`, subí la versión de `CACHE` en `sw.js`** (ej. `gymbrain-v21-1` → `gymbrain-v21-2`). Si no, el iPhone sigue mostrando la versión vieja.
- `manifest.json` **no lleva `start_url`**: con ella iOS da 404 al abrir desde la pantalla de inicio. Los íconos de iOS son los PNG (`icon-180/192/512.png`).
- Actualizá `APP_VERSION` cuando haya un cambio visible.
- Fotos de ejercicios: free-exercise-db (Unlicense). Anatomía: js-rich-body-highlighter (MIT). Mantené los créditos en Ajustes.

## Estética (lo más importante)
- Premium y oscura. Nunca fondo blanco, nunca diseño plano o genérico.
- Paleta actual ("Hierro"): `--bg #0C0B0A`, `--card #161412`, `--acc #FF5420` (naranja brasa), `--xp #FFB224` (ámbar). Tipografías: Anton (títulos y números), Archivo (texto) y JetBrains Mono (etiquetas).
- Los detalles con "alma" son sagrados: el logo propio, la barra con los discos dibujados, el mapa muscular 3D que gira, las cinemáticas de subida de nivel y récord, el confeti y los XP flotantes. **No los borres ni los simplifiques.**
- Nada de emojis como íconos principales. Usá los SVG propios (objeto `I`).
- Los textos van en español rioplatense con voseo ("entrenaste", "dale"), con carácter y sin frases de app genérica.

## Producto
- La gamificación es central: XP, niveles, rango E→S, atributos, misiones semanales, trofeos y títulos. No la recortes.
- El motor de progresión (`suggest()`, doble progresión, ciclo de 9 semanas con deload) está pensado con evidencia. No lo cambies sin explicar por qué.
- Es mobile-first. Respetá las safe areas del iPhone (la isla dinámica no puede tapar headers) y usá botones de al menos 44 px.
- La navegación hacia atrás (stacks por pestaña + `popstate`) ya funciona. Probala después de tocar pantallas.

## Cómo trabajar
1. Antes de commitear, probá con Playwright en viewport de iPhone 13 (390×844). Sacá screenshots de las pantallas que tocaste y fijate que no haya errores en la consola.
2. Hacé cambios chicos y commits claros, en español.
3. Si un cambio puede romper datos guardados, avisá antes de hacerlo.
4. Al terminar, resumí en 2-3 líneas qué cambió y qué tiene que mirar Rodrigo en el celu.
