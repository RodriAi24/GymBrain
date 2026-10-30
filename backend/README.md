# Respaldo en la nube de GymBrain

Un Cloudflare Worker (`worker.js`) con un KV (`gymbrain-sync`). Guarda la copia de la app **ya cifrada en el celu**: el servidor no puede leerla.

- `latest`: la última copia. `day:AAAA-MM-DD`: una por día (se guardan 30). `month:AAAA-MM`: una por mes, para siempre.
- `owner`: SHA-256 del token del dueño. Lo fija la primera llamada a `/v1/claim` (o el secreto `AUTH_HASH`, si lo cargás).
- Una copia con menos sesiones que la guardada no pisa nada sin `?force=1` (la app pregunta antes).

## Publicarlo desde el panel de Cloudflare

1. **Workers & Pages → Create → Start with Hello World**, nombre `gymbrain-sync`, **Deploy**.
2. **Edit code**: borrá todo, pegá `worker.js` y **Deploy**.
3. **Settings → Bindings → Add → KV namespace**: nombre de variable `GB`, namespace `gymbrain-sync`.
4. **Settings → Variables and Secrets → Add** (tipo Text): `ALLOWED_ORIGINS` = `https://rodriai24.github.io`.
5. Copiá la dirección (`https://gymbrain-sync.<tu-subdominio>.workers.dev`) y ponela en `SYNC_URL` en `index.html`.

Con wrangler: `npx wrangler deploy` dentro de esta carpeta (el id del KV ya está en `wrangler.toml`).

Apenas esté publicado, activá el respaldo en la app (Ajustes → Respaldo en la nube): la primera clave que se conecta queda como dueña.
