# GymBrain · Rediseño de layout, metas y registro (V29)

Documento de trabajo para Claude Code. Lo escribió un análisis de producto sobre la **V28.1** (`index.html` de este repo), recorriendo la app en iPhone 13 con 7 semanas de historial sintético: Upper/Lower, 25 sesiones, 37 pesajes y 21 días de calorías.

Leé primero `CLAUDE.md`. Todo lo que dice ahí sigue valiendo: no romper datos `gb2_*`, estética Hierro, voseo, alma, safe areas, subir `CACHE` en `sw.js` y probar en 390×844.

**Qué es este trabajo:** reorganizar dónde vive cada cosa, unificar las metas en un solo motor coherente, darle contenido de verdad a peso, calorías y metas, y bajar la densidad visual. **No** es cambiar la estética, el motor de progresión ni la gamificación.

---

## 0. Cómo trabajar este documento

- Se hace en **5 etapas** (sección 9). Al terminar cada una: screenshots en 390×844 de cada pantalla tocada, cero errores de consola, el script de auditoría de la sección 10, `CACHE` y `APP_VERSION` actualizados, y **esperar el OK de Rodrigo** antes de seguir.
- Si algo de este documento choca con el código real (una función que no existe, un dato que no cierra), frená y avisá antes de inventar.
- Ninguna etapa puede perder funcionalidad. La tabla de la sección 3.3 es el checklist: cada bloque viejo tiene que aparecer en su lugar nuevo.

---

## 1. Diagnóstico

### 1.1 Medición (V28.1, iPhone 13, historial de 7 semanas)

| Pantalla | Alto total | Pantallas de scroll* | Textos visibles | Textos < 11 px | Textos con contraste < 4.5:1 |
|---|---|---|---|---|---|
| Hoy | 2.682 px | ~3,6 | 106 | 29 | 15 |
| Estado | 5.113 px | ~6,9 | 180 | 45 | 42 |
| Progreso | 11.876 px | **~16** | 442 | 109 | 61 |
| Ajustes (sheet) | 1.873 px | ~2,5 | — | — | — |

*Pantallas de scroll: alto útil de ~740 px por pantalla en modo app.

Posiciones clave, medidas desde arriba de la página:
- **Hoy:** el botón "Empezar" está a 1.413 px, casi dos pantallas abajo. La acción principal de la app no se ve al abrirla.
- **Progreso:** "Peso corporal" arranca a 5.218 px y "Calorías" a 6.037 px. Las features nuevas están a 7-8 pantallas de scroll, debajo de 25 filas de "Por ejercicio".
- **Contraste:** `--ink3` (#6E665D) sobre `--card` da **3,26:1** y sobre `--card2` 3,04:1. Está por debajo del mínimo de 4,5:1 de WCAG para texto normal, y se usa en etiquetas, fechas, aclaraciones y metadatos de toda la app. `--ink4` da 1,91:1.
- **Tamaño:** `.lab-m` usa 10 px y `.bg-meta` 10,5 px. Apple fija 11 pt como mínimo en iOS. Una de cada cuatro líneas de Estado y Progreso está debajo de eso.

Esto es lo que Rodrigo describe como "todo muy comprimido": mucho texto chico y gris, apilado en páginas larguísimas.

### 1.2 Problemas de arquitectura

**P1 · Progreso está escondido y es gigante.** No es una pestaña. Se llega por un ícono chico arriba de Estado o por "Ver progreso" en Hoy. Adentro hay unas 16 pantallas de scroll que mezclan fuerza, volumen, peso, calorías, logros e historial, sin jerarquía.

**P2 · Duplicados.** La misma información aparece dos o más veces:

| Bloque | Dónde aparece hoy |
|---|---|
| Meta de banca (`benchGoalCard`) | Estado y Progreso, idéntica |
| Logros/trofeos (52 ítems) | Estado ("Trofeos", en grilla) y Progreso ("Logros", en lista). Son unas 4 pantallas repetidas |
| Anillo de la semana (`weekRing`) | Hoy y Progreso |
| Totales (sesiones, subidas, récords) | Hoy (`stat3`) y Progreso (`pg4`) |
| Misiones | Hoy y Estado |
| Peso corporal | Hoy (registro), Estado (ventana de estado y proyecciones), Progreso (panel), Ajustes (meta de peso y "peso de referencia") |
| Calorías | Hoy (registro), Estado (proyecciones), Progreso (panel) y la hoja de calorías, que repite el panel completo |
| Aviso "son estimaciones…" | 4 veces en el código (`kc-legal`), varias en la misma pantalla |

**P3 · Estado mezcla dos cosas.** Estado es la ficha del personaje (rango, nivel, atributos, trofeos), pero ahora también tiene la meta de banca, las proyecciones de peso y calorías y consejos de nutrición ("Vas rápido, bajá 150 kcal"). La identidad gamer y el coaching de salud compiten en la misma pantalla.

**P4 · Ajustes es un cajón de sastre.** Un solo sheet de unas 2,5 pantallas mezcla nombre, meta de sesiones, tema, sonido, ciclo, orden de ejercicios, perfil nutricional (sexo, altura, edad, actividad), modo, ajuste calórico, proteína, meta de peso, metas de banca, "peso de referencia", exportar, importar y borrar. Las metas **solo** se editan ahí, lejos de donde se ven. Apple recomienda usar un sheet para "una tarea acotada", y esto no lo es.

**P5 · La acción principal está fuera de vista.** En Hoy, entre el hero y "Empezar" hay barra de nivel, top set, barra con discos, mapa 3D, coach y la lista de 7 ejercicios. Todo eso suma valor, pero el botón queda a casi 2 pantallas.

### 1.3 Problemas de las metas (bugs de coherencia)

Con los mismos datos, en la **misma pantalla** de Estado se lee:

1. Tarjeta de meta: **70 kg · jun 2027** (la meta que puso Rodrigo).
2. Proyecciones: "A este ritmo llegás a **70 kg en jul 2027** · EN CAMINO".
3. Fila de hitos: el hito 70 aparece planificado para **nov 2027**.
4. Mensaje de la tarjeta: "Para 70 necesitás +3,6 kg por mes. **Es exigente**…", mientras la proyección dice **"EN CAMINO"**.

Causas en el código:
- `milePlan(cur)` reparte los hitos en línea recta entre hoy y la **última** meta (100 kg, dic 2028). Ignora la meta intermedia (70 kg, jun 2027), así que el 70 cae en nov 2027.
- `benchMsg()` y `benchProj()` calculan cada uno por su lado y con criterios distintos (ritmo necesario contra regresión), sin un estado único que mande.
- Las barras de progreso van **desde 0 kg** (40/70 = 57 %). Eso no representa el esfuerzo real: nadie arranca la banca en 0 kg, y el progreso que Rodrigo sí logró (por ejemplo de 30 a 40 kg) no se ve en ningún lado.

Hay más problemas de coherencia:
- **Dos pesos distintos sin aclarar.** "66,2 kg" (último pesaje, en Hoy y en la ventana de Estado) y "66,3 kg" (promedio de 7 días, en Proyecciones y Progreso). `bwNow()` usa el último pesaje para los ratios de fuerza, aunque toda la app predica que "lo que cuenta es el promedio".
- **"Peso de referencia"** aparece en el bloque de metas de banca de Ajustes, sin relación con la meta de peso que está dos bloques más arriba.
- La hoja de calorías tiene **dos botones de guardado** ("Corregir" para kcal y "Guardar" para proteína) y repite entero el panel de Progreso.

### 1.4 Pobreza de contenido

Las features nuevas están, pero se muestran como texto:
- La meta de banca no tiene **ningún gráfico**: es un número y barras. No se ve la historia ni la ruta.
- Las proyecciones son tres filas de texto. Nada visual compara "dónde estoy" con "dónde debería estar".
- El gráfico de peso no muestra la meta ni el ritmo buscado.
- Las calorías no muestran constancia de registro (qué días anotaste), y eso es justamente lo que premia la app.
- No hay un momento que **junte** fuerza, peso y calorías: cada uno vive en su isla. El motor ya cruza los datos (`suggestion()`), pero el resultado aparece como un aviso suelto en Estado.

---

## 2. Principios de diseño que aplicamos

Cada decisión de abajo sale de uno de estos principios.

1. **Las pestañas son para navegar entre secciones de primer nivel, y conviene que sean pocas** (Apple HIG, *Tab bars*). Progreso es una sección de primer nivel. Ejercicios y Aprender son material de consulta y pueden compartir una.
2. **Divulgación progresiva, con 2 niveles como máximo** (Nielsen Norman Group). En el primer nivel va lo que se usa seguido; lo demás, detrás de un disparador claro. Lo que aparece primero comunica qué es importante.
3. **Un sheet sirve para una tarea acotada y cercana al contexto. Uno solo a la vez** (Apple HIG, *Sheets*). Ajustes deja de ser un sheet y pasa a ser una página. Los editores chicos (pesaje, calorías, meta) sí son sheets.
4. **Los gráficos tienen un titular que dice qué aprender** (Apple HIG, *Charting data*): "Vas en camino a 70 kg", no solo una línea. Mismo estilo y mismos colores para los mismos datos en toda la app.
5. **Gradiente de meta y progreso dotado** (Kivetz y otros, 2006; Nunes y Drèze, 2006). La motivación sube cuando la meta se ve cerca y cuando el progreso no arranca en cero. Los hitos intermedios mandan sobre la meta final, y las barras arrancan desde lo que ya lograste.
6. **Legibilidad:** texto de 11 px como mínimo (Apple: 11 pt mínimo en iOS) y contraste de 4,5:1 para texto normal (WCAG 2.2, 1.4.3).
7. **Una sola fuente de verdad por dato:** cada número (peso, 1RM estimado, estado de la meta) se calcula en un solo lugar y se muestra siempre con la misma etiqueta.

---

## 3. Nueva arquitectura de información

### 3.1 Pestañas

| Antes | Después |
|---|---|
| Hoy · Plan · Ejercicios · Estado · Aprender | **Hoy · Plan · Progreso · Estado · Biblioteca** |

- **Progreso** pasa a ser pestaña. Ícono: el de gráficos (`I.stats`).
- **Biblioteca** = Ejercicios + Aprender, con un control segmentado arriba: `Ejercicios | Aprender`. Recordá el último segmento elegido.
- `PAGE_TAB`: `progreso` e `historial` → `progreso`. `ejercicios`, `ejercicio`, `aprender`, `articulo`, `faq`, `glosario`, `supps`, `creadores` y `metodos` → `biblioteca`.
- Abrir un ejercicio desde Progreso tiene que apilarse **dentro de Progreso**, como ya hace `go(p, ctx)` sin `replace`. El "Volver" vuelve a Progreso.
- Los stacks por pestaña (`STACKS`) se recrean para las pestañas nuevas. Probá el gesto atrás de iOS en todas.

### 3.2 Qué responde cada pestaña

| Pestaña | Pregunta que responde | Frecuencia |
|---|---|---|
| Hoy | ¿Qué hago hoy y cómo vengo esta semana? | Diaria |
| Plan | ¿Qué programa sigo y cómo está armado? | Ocasional |
| Progreso | ¿Estoy avanzando? (fuerza, cuerpo, volumen, historial) | Semanal |
| Estado | ¿Quién soy en el juego? (rango, nivel, atributos, trofeos) | En momentos de recompensa |
| Biblioteca | ¿Cómo se hace esto? ¿Qué dice la evidencia? | Consulta |

### 3.3 Mapa de migración (checklist: nada se pierde)

| Bloque actual | Dónde estaba | Dónde va |
|---|---|---|
| Fecha, ciclo, botón Ajustes | Hoy | Hoy (sin cambios) |
| Hero "Hoy toca…" | Hoy | Hoy |
| `levelBar()` | Hoy | Hoy, en versión compacta de una línea |
| Top set con barra y discos | Hoy | Hoy, dentro de la tarjeta de sesión |
| Mapa 3D "Hoy se rompe" | Hoy | Hoy, dentro de la tarjeta de sesión (más bajo, ver 4.1) |
| Coach (`say('hoy')`) | Hoy | Hoy |
| Lista de ejercicios del día | Hoy | Hoy (filas más compactas, ver 4.1) |
| Empezar · Calentar · Saltear · Otra sesión | Hoy | Hoy, **arriba**: el botón Empezar entra en la primera pantalla (ver 4.1) |
| Registro (peso y calorías) | Hoy | Hoy, como "Check-in de hoy" |
| Anillo de la semana | Hoy y Progreso | **Solo Hoy**, fusionado con misiones |
| `stat3` (sesiones, subidas, récords) | Hoy | Progreso › Historial (encabezado) |
| Próximo logro (`nextAchBox`) | Hoy | Estado › Trofeos ("El próximo") |
| Misiones | Hoy y Estado | Hoy (resumen) y Estado (completo) |
| Últimas sesiones | Hoy | Hoy: una sola línea "Última: Inferior 2 · hace 2 días". El resto va a Progreso › Historial |
| Avatar, nombre, título | Estado | Estado |
| Rango global con escalera | Estado | Estado |
| `benchGoalCard()` | Estado y Progreso | **Progreso › Fuerza** (una vez), más una tarjeta mini en Hoy |
| `projCard()` | Estado | Se divide: banca → Fuerza; peso y calorías → Cuerpo; sugerencia → Hoy (insight) |
| Ventana de estado (nivel, XP, racha, peso) | Estado | Estado. El peso pasa a mostrar el promedio de 7 días, con esa etiqueta |
| Atributos | Estado | Estado |
| Rangos de fuerza | Estado | Estado (con acceso desde Fuerza) |
| Trofeos por categoría | Estado | Estado |
| Selector de levantamiento y gráfico de top set | Progreso | Progreso › Fuerza |
| `pg4` (totales) | Progreso | Progreso › Historial |
| Días entrenados (heatmap) | Progreso | Progreso › Historial |
| Sesiones por semana | Progreso | Progreso › Historial |
| Kilos por semana | Progreso | Progreso › Volumen |
| Mapa muscular y series por músculo | Progreso | Progreso › Volumen |
| Balance (radar) | Progreso | Progreso › Volumen |
| Por ejercicio | Progreso | Progreso › Fuerza (top 8 más "Ver todos") |
| Peso corporal (`bwPanel`) | Progreso | Progreso › Cuerpo |
| Calorías (`kcalPanel`) | Progreso | Progreso › Cuerpo |
| Logros (lista de 52) | Progreso | **Se elimina** (ya está en Estado) |
| Todas las sesiones | Progreso | Progreso › Historial, agrupadas por mes |
| Ajustes (sheet) | Sheet | **Página** `ajustes` agrupada (ver 4.5) |
| Ejercicios | Pestaña | Biblioteca › Ejercicios |
| Aprender | Pestaña | Biblioteca › Aprender |

---

## 4. Pantalla por pantalla

Reglas de layout para todas las pantallas:
- **Un solo héroe por pantalla**, el número o la tarjeta más importante. El resto, en jerarquía menor.
- **Como máximo dos niveles de anidado**: tarjeta, y adentro filas. Nada de tarjeta adentro de tarjeta adentro de tarjeta.
- **Encabezado de sección con titular, no solo rótulo.** "PESO CORPORAL" se convierte en un titular que dice algo: "Subiendo 0,25 kg por semana".
- **Los avisos legales van una vez por pantalla**, detrás de un ícono `i` que abre un sheet "Cómo calculamos esto". No repetir "son estimaciones…" en cada tarjeta.

### 4.1 Hoy (objetivo: ≤ ~2.200 px y botón Empezar visible sin scroll)

Orden nuevo:

1. **Encabezado** (sin cambios).
2. **Hero** "Hoy toca Superior 1." Bajá el tamaño máximo de 72 a unos 56 px para que el bloque ocupe menos alto. Subtítulo con la semana: "Vas 4 de 4 esta semana".
3. **`levelBar()` compacta:** una sola fila con nivel, barra de XP y racha. El título solo si es distinto del nombre del nivel.
4. **Tarjeta de sesión** (el corazón de Hoy):
   - Fila superior: top set (número grande) y barra con discos, como hoy.
   - **Botón "Empezar Superior 1"** inmediatamente debajo, dentro de la tarjeta, con Calentar · Saltear · Otra sesión abajo en fila.
   - Debajo del botón: mapa 3D "Hoy se rompe" con los 4 músculos (alto máximo unos 220 px) y la lista de ejercicios en filas compactas (nombre más objetivo en una línea).
   - Si el botón deja de verse al hacer scroll, aparece un **botón flotante** "Empezar" arriba de la tab bar (mismo patrón que `fabback`). Desaparece cuando el botón original vuelve a verse.
5. **Check-in de hoy** (reemplaza a "Registro"): una tira de dos fichas, Peso y Calorías, con el mismo comportamiento de hoy. Si ya está anotado, la ficha muestra ✓ y el valor. Sumá debajo una línea de **constancia**: 7 puntitos con los días de la semana en que anotaste algo.
6. **Meta activa** (tarjeta mini nueva, ver 5.4): "PRÓXIMO HITO · BANCA 50 KG", "faltan 10 kg", una barra desde el hito anterior y el estado ("en camino · marzo"). Al tocarla va a Progreso › Fuerza.
7. **Tu semana:** el anillo (`weekRing`) y las 3 misiones en **una sola tarjeta**. La misión "Cumplí la meta semanal" es literalmente el anillo, así que no se repite como fila: se marca en el anillo.
8. **Insight del coach** (si hay): la sugerencia de `suggestion()`, una sola, descartable. Sale de Estado y se muestra acá.
9. **Cierre de semana** (ver 6.1), solo el lunes o el primer día que se abra la app en la semana nueva, hasta que se haga o se descarte.
10. **Última sesión:** una línea que lleva al detalle de esa sesión. "Ver historial" lleva a Progreso › Historial.

Se van de Hoy: `stat3` y "Próximo logro".

### 4.2 Progreso (pestaña nueva, con control segmentado)

Arriba, el título "Progreso" y un control segmentado fijo (sticky) debajo del encabezado: **`Fuerza · Cuerpo · Volumen · Historial`**. Renderizá **solo el segmento activo**: hoy se arman 442 nodos de texto y dos escenas 3D aunque no se vean. Recordá el segmento elegido (variable de estado más una clave opcional en `S`, sin migración porque `S` acepta campos nuevos). Objetivo: **≤ 3 pantallas por segmento**.

#### Fuerza
1. **Héroe: tarjeta de meta** (ver 5.3), con el **gráfico de ruta** (ver 6.2). Es la estrella del segmento.
2. **Récords personales:** lista compacta de los 5 levantamientos principales con mejor serie, 1RM estimado y fecha (sale de `bestOf`). "Ver todos" despliega el resto.
3. **Top set por levantamiento:** los chips y `topSetChart` que ya existen. Mismo estilo de gráfico que la ruta.
4. **Fuerza relativa** (nuevo): línea de 1RM de banca ÷ peso promedio en el tiempo. Rodrigo está subiendo de peso a propósito, así que este ratio le muestra si la fuerza acompaña. Al tocarla va a Estado › Rangos de fuerza.
5. **Por ejercicio:** top 8 más "Ver los N ejercicios".

#### Cuerpo
1. **Héroe: peso promedio de 7 días** con su tendencia, y un **titular** ("Subiendo 0,25 kg por semana: un poco más rápido que tu plan").
2. **Gráfico de peso** (`bwPanel`), con dos agregados:
   - Línea horizontal punteada de la meta de peso, si hay.
   - **Banda de ritmo**: una franja suave que muestra dónde debería ir la línea del promedio según el modo (para ganar, 0,06-0,12 kg por semana desde el primer pesaje del rango). Así se ve sin leer si va rápido, lento o justo.
3. **Ritmo:** un medidor horizontal simple con las zonas lento · en zona · rápido, para el modo elegido. Nada de rojos: el estado neutro va en `--ink2` y la zona en `--xp`.
4. **Calorías:** el panel actual simplificado. Número de hoy contra objetivo, promedio de 7 días, proteína, barras de la semana con la línea de objetivo y **puntitos de constancia** (días anotados de los últimos 14).
5. **Tu mantenimiento:** el valor estimado (fórmula o adaptativo), con la confianza como chip y una línea "Cómo lo calculamos" que abre el sheet de la sección 4.
6. **Tus datos:** fila que abre un sheet chico con altura, edad, sexo, actividad, modo, ajuste y proteína. Es el mismo formulario que hoy está en Ajustes, en contexto.
7. **Historial de pesajes:** colapsado ("Ver los 37 pesajes"). Se edita y borra igual que hoy.

#### Volumen
1. **Héroe: mapa muscular 3D** con las series por músculo (`bodyHeat`), tal cual.
2. Balance (radar).
3. Kilos por semana.

#### Historial
1. **Encabezado de totales:** sesiones, toneladas, récords, subidas y mejor racha (lo que hoy es `pg4` y `stat3`).
2. **Días entrenados** (heatmap de 16 semanas) y sesiones por semana, con la línea de la meta.
3. **Sesiones agrupadas por mes** (encabezado "Octubre 2026 · 13 sesiones"), con todas las sesiones y no solo 40. Para no cargar todo de una, paginá de a 20 con "Ver más".

### 4.3 Estado (objetivo: ≤ ~3.500 px)

Estado vuelve a ser **la ficha del personaje**:
1. Encabezado con avatar, nombre y título (sin cambios). El botón de gráficos de arriba se va, porque Progreso ya es pestaña.
2. Rango global con escalera (sin cambios).
3. Ventana de estado: nivel, XP, racha y **peso (prom. 7 d)**.
4. Atributos.
5. Rangos de fuerza.
6. Misiones (lista completa).
7. Trofeos: arriba, **"El próximo"** (lo que era `nextAchBox`, con su barra). Después las categorías en grilla, como hoy. Las categorías con 0 desbloqueados pueden ir colapsadas a una fila: "Fuerza · 0/18 · Ver".

Se van de Estado: `benchGoalCard` y `projCard` (a Progreso) y la sugerencia (a Hoy).

### 4.4 Biblioteca

Un control segmentado `Ejercicios | Aprender` arriba. El contenido de cada uno, como está hoy. Es el único cambio.

### 4.5 Ajustes (deja de ser sheet: pasa a ser la página `ajustes`)

Se abre desde el engranaje de Hoy (y de Estado, si querés). Es una lista agrupada estilo iOS, con títulos de grupo y filas que tocan para editar:

| Grupo | Filas |
|---|---|
| **Perfil** | Nombre · Sexo · Altura · Edad · Peso inicial (antes "peso de referencia", con la aclaración "se usa hasta tu primer pesaje") |
| **Entrenamiento** | Sesiones por semana · Ciclo del programa (semana y reinicio) · Orden de ejercicios (restablecer) · Sonido al terminar el descanso |
| **Metas** | Press de banca (abre el editor de metas, 5.5) · Peso corporal (abre el mismo editor) |
| **Nutrición** | Mostrar calorías · Modo · Ajuste diario · Proteína · Actividad |
| **Apariencia** | Oscura / Clara |
| **Datos** | Recordatorio en Calendar · Exportar · Importar · Importar V18 (si aplica) · Borrar todo (al final, en rojo) |
| **Acerca de** | Versión y créditos |

Los campos que hoy se editan en el sheet siguen editándose igual (inputs y segmentados), pero ordenados en estos grupos. Las validaciones (`nutriSet`, `goalSet`, `bwGoalSet`, `goalBw`) se reutilizan tal cual.

### 4.6 Sheets

- **Pesate** (`bwQuick`): está bien como está. Es corto, una tarea y un botón. No lo toques salvo por tipografía y contraste.
- **Calorías** (`kcalSheet`), reordenado para registrar rápido:
  1. Arriba, el número de hoy grande con el objetivo al lado.
  2. Sumar: +100 · +250 · +500 · Otro.
  3. "Total del día" editable y "Proteína" con +10 · +25, **sin botones de guardado por campo**: se guarda al confirmar con el teclado o al salir del campo.
  4. **Un solo botón: "Listo".**
  5. Una línea al pie: "Promedio 7 días: 2.616 · Ver tendencia ›", que lleva a Progreso › Cuerpo.
  
  Se va del sheet: el panel completo con barras, fuente y aviso legal. Ese contenido vive en Progreso › Cuerpo.
- **Editor de metas** (nuevo, 5.5).
- **Cómo calculamos esto** (nuevo): un solo texto con Epley, Mifflin-St Jeor, mantenimiento adaptativo, regresión y la aclaración de que son estimaciones y no reemplazan a un médico o nutricionista. Reemplaza las 4 repeticiones de `kc-legal`.

---

## 5. Motor de metas unificado

### 5.1 Una sola función que manda

Creá `goalModel()` como **única fuente de verdad**. `benchGoalCard`, la tarjeta mini de Hoy, el gráfico de ruta, los mensajes y las proyecciones leen de ahí. `benchMsg`, `milePlan` y `benchProj` pasan a ser internas de `goalModel` o se reemplazan.

```
goalModel() → {
  src: 'bench' | 'incline-db',       // de dónde sale el 1RM (como hoy)
  series: [{ d, e1 }],               // 1RM estimado por sesión (benchSeries)
  cur,                               // mejor 1RM estimado (como hoy, para hitos y trofeos)
  trend,                             // valor de la regresión hoy (benchProj.now), si hay datos
  start: { kg, d },                  // PUNTO DE PARTIDA: primer 1RM estimado del historial
  goals: [{ kg, date, from: { kg, d }, pct, needPerMonth, done }],
  route(d) → kg,                     // ruta ideal por tramos (5.2)
  plan: { [hito]: fecha },           // fecha planificada de cada hito, leída de la ruta
  next: { kg, date, prev, faltan },  // próximo hito de BENCH_MILES por encima de cur
  proj: { state, perWeek, eta },     // regresión (igual que benchProj)
  status,                            // 'juntando' | 'adelantado' | 'en camino' | 'atrasado' | 'estancado' | 'cumplida'
  msg                                // UN mensaje, derivado de status
}
```

### 5.2 La ruta por tramos (arregla las tres fechas distintas)

- La ruta es una línea **por tramos**: de `start` a la meta 1 (en su fecha), de la meta 1 a la meta 2, y así.
- La fecha planificada de cada hito (50, 60, 70…) se lee de **esa** ruta. Así, el hito 70 cae exactamente en la fecha de la meta de 70, y los hitos intermedios quedan repartidos dentro de su tramo.
- Si la fecha de `start` es posterior a la de la meta 1 (un caso raro), usá hoy y `cur` como inicio del tramo.

### 5.3 Estado y mensaje únicos

- Con **menos de 4 semanas** de datos: `status = 'juntando'`, con el texto "Juntando datos · 2 de 4 semanas" y la ruta igual dibujada.
- Con datos: compará `trend` (o `cur` si no hay regresión) contra `route(hoy)`:
  - si supera la ruta por 2,5 kg o más → **adelantado**;
  - si está a menos de 2,5 kg → **en camino**;
  - si está debajo de la ruta por más de 2,5 kg → **atrasado**.
- Si la pendiente es menor a 0,15 kg por semana durante 4 semanas o más → **estancado** (pisa a los tres anteriores).
- Si `cur` llegó a la última meta → **cumplida**.
- **El mensaje sale del estado y menciona un solo número**:
  - adelantado: "Vas X kg por encima de la ruta. A este ritmo llegás a 70 en {mes}."
  - en camino: "Vas en la ruta. Para {mes} toca {hito} kg."
  - atrasado: "Estás X kg debajo de la ruta. Se recupera: …" y una acción concreta de `suggestion()`.
  - estancado: el consejo de "Revisá lo invisible" de `suggestion()`.
  
  Nunca dos mensajes con encuadres distintos en la misma tarjeta.
- Los colores del estado siguen como en `ST_COL`: atrasado y estancado van en neutro (`--ink2`), nunca en rojo.

### 5.4 Barras de progreso (progreso dotado, sin mentir)

- Barra de cada meta: **desde `start` hasta la meta**. Por ejemplo, con un inicio de 30 kg, una meta de 70 y un actual de 40: 25 %, con la etiqueta "de 30 a 70 kg". Es real (Rodrigo sí subió esos 10 kg) y no arranca en 0.
- Tarjeta mini de Hoy y "próximo hito": barra **desde el hito anterior** (o desde `start` si todavía no se cumplió ninguno) hasta el próximo, por ejemplo "40 → 50 kg". El hito cercano motiva más que la meta lejana. Al cumplir un hito, mostrá enseguida el siguiente con su barra; nunca un vacío.

### 5.5 Editor de metas (sheet nuevo, se abre desde la tarjeta de meta con "Editar" y desde Ajustes › Metas)

- Filas de metas de banca (kg y fecha), con agregar y quitar. Máximo 4 metas y mínimo 1.
- **Feedback de realismo en vivo** mientras se edita, debajo de cada meta: "Necesitás +3,6 kg de 1RM por mes desde hoy". Usá un chip: **cómoda** (≤ 0,6 kg/mes), **exigente** (≤ 1,5), **muy ambiciosa** (más de 1,5). Mismos umbrales que `benchMsg` hoy.
- Meta de peso corporal (kg y fecha), con la misma idea: "Son 0,3 kg por mes: dentro del ritmo de ganar de a poco".
- Botones Cancelar y Guardar, según las guías de sheets.
- **Datos:** `gb2_goals` sube a `v: 2` solo si necesitás guardar algo nuevo, por ejemplo la fecha de creación de cada meta. `start` se **calcula** desde el historial y no se guarda. Si no hace falta guardar nada nuevo, `v` queda en 1. Toda migración pasa por `loadGoals()` y se valida al importar.

---

## 6. Contenido nuevo (para que las features no sean pobres)

### 6.1 Cierre de semana (check-in semanal)

Es lo que junta fuerza, peso y calorías en un solo momento, al estilo del check-in semanal de MacroFactor, pero gamificado.

- **Cuándo:** en Hoy, a partir del lunes (o del primer día que se abra la app en la semana nueva). Mientras no se cierre ni se descarte, está como tarjeta.
- **Qué muestra de la semana anterior:**
  - sesiones hechas contra la meta;
  - series totales;
  - subidas y récords;
  - Δ de 1RM estimado de banca;
  - Δ del peso promedio contra el ritmo del plan;
  - promedio de calorías contra objetivo y días anotados;
  - **una** recomendación (`suggestion()`, o "Seguí así" si no hay nada que corregir).
- **Acción:** "Cerrar semana" otorga **+30 XP**, con un XP flotante y sin cinemática grande. Puede sumarse como misión opcional del pool: "Hacé el cierre de semana".
- **Datos:** clave nueva `gb2_checkin` `{ v: 1, done: { [weekStart]: fecha } }` con validación, migración en `gb2_schema` y export/import. El XP se suma en `totalXp()` igual que las misiones; revisá que no se duplique.
- **Texto:** voseo, sin culpa. Si la semana fue floja: "Semana corta. Pasa. Esta arranca de cero."

### 6.2 Gráfico de ruta de la meta (Fuerza)

Es el gráfico más importante del rediseño.

- **Eje X:** desde `start.d` hasta la fecha de la meta **activa** (la próxima no cumplida). Un control chico "Ver hasta 100 kg" extiende el eje a la meta final.
- **Capas, en este orden:**
  1. **Ruta ideal:** línea punteada en `--xp`, del inicio a la meta, con los hitos como marcas pequeñas.
  2. **1RM estimado real:** puntos por sesión y línea de tendencia en `--acc`. Mismo estilo que `topSetChart` y `bwPanel`.
  3. **Proyección:** la línea de tendencia extendida en punteado tenue hasta cruzar la meta, con una etiqueta en el cruce ("jul 27").
  4. **Meta:** un punto grande en la fecha y el kilaje de la meta.
- **Titular arriba del gráfico:** el `msg` de `goalModel`.
- Al tocar un punto, un tooltip con la fecha, la serie (por ejemplo "32,5 × 7") y el 1RM estimado.
- **Fuente:** si sale del inclinado con mancuernas, un chip "estimado desde inclinado" con un `i` que lo explica.

### 6.3 Récords personales

Lista con mejor serie, 1RM estimado y fecha por levantamiento. Si el récord es de esta semana, un chip "NUEVO". Sale de datos que ya existen (`bestOf`, `hist`).

### 6.4 Fuerza relativa

1RM de banca ÷ peso promedio (no el último pesaje), en línea, con las referencias de `STANDARDS` como bandas tenues ("Principiante · Novato · Intermedio"). Explica por qué subir de peso no es retroceder.

### 6.5 Constancia de registro

Puntitos de los últimos 7 días en Hoy y de los últimos 14 en Cuerpo: lleno si hubo pesaje o calorías ese día, vacío si no. **Premia registrar, no el número**, como pide `CLAUDE.md`.

### 6.6 Peso: un solo número

- `bwNow()` (o una función nueva `bwRef()`) devuelve el **promedio de 7 días** si hay al menos 3 pesajes en los últimos 7 días; si no, el último pesaje; si no hay pesajes, el peso inicial de Perfil.
- Usalo en los ratios de fuerza, Estado y calorías (Mifflin y proteína).
- Mostralo siempre con su etiqueta: **"66,3 kg · prom. 7 d"**. El último pesaje se muestra solo en la ficha de Peso de Hoy ("Hoy: 66,2") y en el historial de pesajes.
- Es un cambio chico de lógica: avisale a Rodrigo en el resumen de la etapa que los ratios pueden moverse unos décimos.

---

## 7. Sistema visual (sin tocar la identidad Hierro)

### 7.1 Tokens

| Token | Antes | Después | Por qué |
|---|---|---|---|
| `--ink3` (oscuro) | #6E665D (3,26:1 sobre card) | **#8F867B** (5,13 sobre card · 4,79 sobre card2 · 5,49 sobre bg) | Pasa 4,5:1 |
| `--ink3` (claro) | #8A97AC (2,96:1 sobre blanco) | **#5E6B82** (5,38 · 4,78 · 4,96) | Pasa 4,5:1 |
| `--ink4` | #4A443E | Sin cambio, pero **prohibido para texto**: solo bordes, rieles y elementos decorativos | 1,91:1 |

Buscá todos los usos de `--ink4` y `.muted2` con texto y pasalos a `--ink3` o `--ink2`.

### 7.2 Escala tipográfica (mínimo 11 px)

| Rol | Tamaño | Uso |
|---|---|---|
| Número héroe | Anton 56-72 px | Un solo número por pantalla |
| Número de tarjeta | Anton 28-34 px | Valores dentro de tarjetas |
| Título de sección | Anton 22 px | Como hoy (`.sec h2`) |
| Cuerpo | Archivo 15-16 px | Textos de tarjetas y mensajes del coach |
| Secundario | Archivo 13-14 px | Descripciones y aclaraciones |
| Etiqueta mono | JetBrains Mono **11 px** (antes 10) | `.lab-m`, `.bg-meta` (antes 10,5), `.hr-s` |
| Mínimo absoluto | **11 px** | Nada por debajo, incluidos ejes de gráficos y textos de trofeos |

En los gráficos SVG, los textos de ejes quedan en 11 px **efectivos en pantalla**: tené en cuenta el `viewBox` escalado.

### 7.3 Espaciado y densidad

- Escala de espacios: 4 · 8 · 12 · 16 · 24 · 32. Entre secciones, 32 px (hoy son 26).
- Una línea de texto secundario por fila de lista como máximo. Si hace falta más, va al detalle.
- Las listas largas (pesajes, ejercicios, sesiones, trofeos bloqueados) arrancan colapsadas, con "Ver todos (N)".

### 7.4 Gráficos (continuidad)

Todos los gráficos de serie temporal comparten el mismo estilo:
- `--acc` para el dato real;
- `--xp` para metas y rutas;
- punteado para proyecciones;
- grilla en `--line2`;
- ejes en `--ink3` a 11 px.

Cada gráfico lleva un **titular** con la conclusión ("Subiendo 0,25 kg por semana"), no solo un rótulo.

---

## 8. Lo que no se toca

- La estética Hierro (paleta salvo `--ink3`, tipografías, logo, barra con discos, cinemáticas, confeti y XP flotantes).
- El mapa muscular 3D y su fallback 2D.
- `suggest()`, la doble progresión y el ciclo de 9 semanas.
- La pantalla de Entreno, salvo tipografía y contraste globales. Un detalle opcional: limitar el nombre del ejercicio a 2 líneas (hoy "PRESS DE BANCA CON BARRA" ocupa 4).
- Plan y Programa (más allá de la pestaña).
- El formato de cualquier dato `gb2_*` existente.

---

## 9. Etapas

Cada etapa termina con un commit claro en español, screenshots y espera del OK.

**Etapa 1 · Arquitectura y duplicados.**
- Pestañas nuevas (Progreso, Biblioteca) con stacks y `PAGE_TAB`.
- Progreso con los 4 segmentos y render perezoso, redistribuyendo **el contenido actual** sin features nuevas.
- Estado limpio y duplicados eliminados según 3.3.

*Criterios:* la tabla 3.3 cumplida fila por fila; gesto atrás funcionando en todas las pestañas; ningún segmento de Progreso pasa de unos 3.000 px con el historial de prueba; Estado ≤ unos 3.500 px.

**Etapa 2 · Sistema visual.**
- Tokens, escala tipográfica y espaciado de la sección 7, más el sheet "Cómo calculamos esto" en lugar de los avisos repetidos.

*Criterios:* en la auditoría (sección 10), 0 textos < 11 px y 0 textos de menos de 18 px con contraste < 4,5:1, en tema oscuro y claro.

**Etapa 3 · Motor de metas.**
- `goalModel()`, la ruta por tramos, el estado y mensaje únicos, las barras desde el inicio, el gráfico de ruta, la tarjeta de meta en Fuerza, la tarjeta mini en Hoy y el editor de metas.

*Criterios:* el hito de la meta 1 cae exactamente en su fecha; con el mismo historial no aparecen dos fechas ni dos encuadres distintos para la misma meta en ninguna pantalla; tests con historiales sintéticos para los seis estados (juntando, adelantado, en camino, atrasado, estancado, cumplida), con banca y con solo inclinado.

**Etapa 4 · Cuerpo.**
- Peso con banda de ritmo y meta, el medidor de ritmo, el peso único (6.6), calorías simplificadas, el sheet de calorías nuevo, "Tus datos" en contexto, la constancia y la fuerza relativa.

*Criterios:* el mismo valor de peso, con la misma etiqueta, en Hoy, Estado y Cuerpo; casos borde (sin pesajes, 1 pesaje, huecos de 10 días, cambio de modo, calorías ocultas) sin errores.

**Etapa 5 · Hoy y Ajustes.**
- Hoy reordenado (4.1), con botón flotante de Empezar.
- Cierre de semana con su clave, XP, export e import.
- Ajustes como página agrupada.

*Criterios:* Hoy ≤ unos 2.200 px con sesión planificada y sin cierre de semana; botón Empezar visible sin scroll en 390×844; el cierre de semana aparece el lunes, da XP una sola vez y no vuelve a aparecer.

---

## 10. Auditoría automática (correla al final de cada etapa)

Con Playwright en el viewport de iPhone 13, sobre cada pantalla visible, contá:

```js
// Pegalo en page.evaluate() con la página de interés visible
() => {
  const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
  const bgOf = el => { while (el) { const b = getComputedStyle(el).backgroundColor; const a = b.match(/[\d.]+/g); if (a && (a.length < 4 || +a[3] > .5)) return b; el = el.parentElement; } return 'rgb(12,11,10)'; };
  const pg = [...document.querySelectorAll('.page')].find(p => getComputedStyle(p).display !== 'none');
  let total = 0, tiny = 0, lowc = 0;
  pg.querySelectorAll('*').forEach(el => {
    const t = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!t) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width || cs.visibility === 'hidden') return;
    total++; const fs = parseFloat(cs.fontSize); if (fs < 11) tiny++;
    const L1 = lum(cs.color), L2 = lum(bgOf(el)); const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    if (cr < 4.5 && fs < 18) lowc++;
  });
  return { total, tiny, lowc, height: pg.scrollHeight };
}
```

Para los textos dentro de SVG, revisá además que el tamaño en pantalla (tamaño en el `viewBox` × escala) dé 11 px o más.

**Datos de prueba:** armá un `seed` con al menos 7 semanas de Upper/Lower (3-4 sesiones por semana con progresión lenta), unos 35 pesajes con huecos y 3 semanas de calorías. Probá cada pantalla con ese historial y con la app vacía (primer uso).

---

## Fuentes

- Apple Human Interface Guidelines: [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) · [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) · [Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data) · [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) (mínimo de 11 pt en iOS)
- Nielsen Norman Group: [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) · [Dashboards: Making Charts and Graphs Easier to Understand](https://www.nngroup.com/articles/dashboards-preattentive/)
- W3C: [WCAG 2.2 · Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- Gradiente de meta y progreso dotado (Kivetz, Urminsky y Zheng, 2006; Nunes y Drèze, 2006), resumen en [CX Knowledge Database · Goal gradient](https://www.ux-strategy.ch/en/effects/goal-gradient.html)
- Referentes: [MacroFactor · Dashboard](https://help.macrofactorapp.com/en/articles/22-get-to-know-your-dashboard) (tendencia de peso, gasto y progreso de meta como tarjetas interpretadas) · [Hevy · Progreso y estadísticas](https://www.hevyapp.com/features/gym-progress/) (estadísticas, medidas y calendario separados)
