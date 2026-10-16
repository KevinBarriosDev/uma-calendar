# Uma Calendar: diseño

Fecha: 2026-10-16. Estado: implementado (v1).

## Objetivo

Web pública con el calendario de carreras de la carrera de entrenamiento de *Umamusume: Pretty Derby*, armada como en el juego: los 3 años (Junior, Classic, Senior), cada mes partido en principio (Early) y fin (Late). Tocás un turno y ves qué carreras se corren ahí y qué Umas tienen un objetivo en ese turno, para poder consultarlo sin tener el juego abierto. Por ejemplo, para elegir una Uma que tenga libre "Senior, Late March".

No existe hoy una página así: los planificadores de carreras que hay se usan como formulario y lista, no como calendario.

## Decisiones tomadas

| Tema | Decisión |
| --- | --- |
| Público | Abierto, no personal. Herramienta de consulta: sin cuentas ni servidor. Si algún día guarda algo, va en el navegador |
| Servidor del juego | Solo Global. Lo que no salió en Global no aparece |
| Idioma de la interfaz | Solo inglés (excepción a la regla de español del `CLAUDE.md` de la raíz). Documentación interna y commits en español |
| Stack | Astro + TypeScript estricto; la grilla interactiva como isla de React |
| Hosting | Sitio estático en Vercel |
| Repo | Propio y público, como Uma Night. `Uma/uma-calendar/` va al `.gitignore` de la raíz |
| Datos | Cargados a mano en `data/manual/`. Carreras de umamusu.wiki (CC BY-SA 4.0); objetivos cargados por el autor y verificados con capturas |
| Diseño | Celular: grilla de un año con pestañas y hoja de detalle desde abajo. Escritorio: los 3 años juntos y panel de detalle a la derecha |
| Estilo | Inspirado en el juego, con piezas propias. Se pule después |

## Alcance de la versión 1

1. **Calendario y turno.** La grilla de 72 turnos. Al tocar un turno se ven sus carreras.
2. **Umas por turno.** En el detalle del turno: las Umas con objetivo ahí, las que quizás (rama alternativa), las que tienen una meta (fans o cantidad de carreras) que vence ahí y las que lo tienen libre.
3. **Vista por Uma.** Al elegir una Uma, sus turnos se marcan en la grilla. Cada Uma tiene además su página propia.

Datos de arranque: las G1 del calendario común, Debut, Maiden y los objetivos de 6 Umas. El resto se suma de a poco.

Queda afuera, para más adelante: buscador de carreras, "solo mis Umas", favoritas, escenarios con carreras propias, G2/G3/OP completos.

## Modelo

### El turno

Unidad central. 72 turnos numerados del 1 al 72:

```
turno = (año − 1) × 24 + (mes − 1) × 2 + mitad
año: 1 Junior, 2 Classic, 3 Senior · mes: 1–12 · mitad: 1 Early, 2 Late
```

Funciones puras en `src/lib/turn.ts`: `toTurn({ year, month, half })`, `fromTurn(n)`, `turnLabel(n)` → `"Senior · Late March"`. Valores conocidos: debut = turno 12 (Junior, Late June); Arima Kinen = turnos 48 y 72.

### Tipos

Los tipos públicos están en `src/data/types.ts` y sus schemas zod en `src/data/schema.ts` (atados con un chequeo de compilación).

- `Race`: id (slug), nombre, grado, hipódromo, superficie, distancia, categoría, sentido (estos últimos pueden ser `null`), turnos en que se corre (ordenados) y `verified`.
- `Character`: **una Uma** (las versiones comparten objetivos), con su lista de `versions`, fecha de salida en Global, objetivos y `verified`.
- `Objective`, con `order`, `turn` y `verified`:
  - `race`: una o más carreras ("ganá una de estas"), puesto requerido (0 = correrla, 1 = ganarla, N = top N) y `alternatives` (ramas: otro turno u otra carrera para el mismo objetivo).
  - `fans`: cantidad de fans para el turno límite.
  - `race-count`: top N en X carreras de cierto grado o más, para el turno límite.

En un turno, cada Uma cae en un solo grupo, con esta precedencia: **busy** (objetivo de carrera) > **maybe** (rama alternativa) > **goal** (vence una meta de fans o de cantidad de carreras; ese turno no obliga a correr) > **free**.

## Datos

### Fuente

- **Carreras:** tabla "G1 Races Calendar" de [umamusu.wiki](https://umamusu.wiki) (CC BY-SA 4.0). "Turn 1" de la tabla = Early, "Turn 2" = Late. La wiki no da el sentido de giro (queda `null`); las JBC cambian de sede y distancia según la edición (quedan `null`, con la categoría explícita).
- **Carreras que no son G1:** solo las que piden los objetivos cargados. Si la wiki no las tiene, las carga el autor con `verificar: true`.
- **Objetivos:** los carga el autor. Quedan con `verificar: true` hasta confirmarlos con capturas del juego. El sitio marca lo no verificado con "unverified".
- No se copian datos de sitios sin permiso explícito.

### Pipeline

```
data/manual/races.json, characters.json   cargados a mano (año, mes, early/late)
src/data/manual.ts                          conversión pura: turnos, categoría, referencias, verified
scripts/data/build.ts                       lee, valida con zod, escribe src/data/*.json (sí se suben)
```

- `npm run data:build`. El diff de git muestra qué cambió.
- **Validación con zod** de la entrada y de la salida. Si algo está mal, el build se corta con un error que dice archivo, Uma o carrera y campo, en vez de escribir datos rotos.
- Cada objetivo tiene que caer en un turno en el que su carrera se corre; si no, el build se corta.
- Licencia de los datos: CC BY-SA 4.0 (`DATA-LICENSE`).

## Interfaz

### Rutas

| Ruta | Qué muestra |
| --- | --- |
| `/` | El calendario (isla de React) |
| `/characters/<id>/` | Objetivos de la Uma en orden, con un mini calendario |
| `/races/<id>/` | Ficha de la carrera, sus turnos y qué Umas la tienen de objetivo |

Las páginas de Umas y carreras se generan en el build como HTML (para que Google las indexe), con título y descripción propios.

**Estado en la URL:** `/?uma=special-week&turn=48`. El turno y la Uma elegidos se leen y escriben en la query string, así el link se puede compartir y el botón "atrás" funciona. Un valor inválido se ignora y no rompe la página.

### Calendario

- **Celular (< 900 px):** pestañas Junior / Classic / Senior y una grilla de 12 filas (meses) × 2 columnas (Early, Late). Cada casillero muestra el grado de sus carreras. Al tocar uno, sube una hoja desde abajo con el detalle. Sin scroll horizontal a 360 px.
- **Escritorio (≥ 900 px):** los 3 años uno al lado del otro y un panel de detalle a la derecha.
- **Detalle del turno:** carreras (grado, nombre, hipódromo, pista, distancia, categoría, sentido de giro; cada una enlaza a su página), "Objective this turn", "May have an objective", "Goal deadline this turn" y "Free this turn".
- **Selector de Uma** con buscador. Al elegir una, sus turnos se pintan: objetivo en naranja, posible con borde punteado, meta con borde propio, con leyenda.
- **Accesibilidad:** el grado va escrito además del color. Los casilleros son botones con su nombre ("Senior, Late March, 3 races") y se pueden recorrer con el teclado. Contraste AA en ambos temas.

### Estilo inicial

Encabezado verde con degradado, tarjetas blancas redondeadas y colores por grado: G1 azul, G2 rosa, G3 verde, OP naranja. Tema claro y oscuro. Todo con tokens de color en CSS para poder cambiar el estilo después sin tocar componentes.

**Nada sacado del juego ni de terceros:** ni imágenes, ni íconos, ni logos, ni fuentes. Las Umas se muestran por nombre.

## Estructura

```
uma-calendar/
  data/manual/        datos cargados a mano
  scripts/data/       build
  src/data/           races.json, characters.json, meta.json (generados), types.ts, schema.ts, manual.ts
  src/lib/            turn.ts, calendar.ts, format.ts, url-state.ts
  src/components/     Calendar.tsx (isla), YearGrid, TurnDetail, CharacterPicker
  src/pages/          index.astro, characters/, races/
  src/styles/         tokens.css, global.css
  tests/              unit (Vitest) y e2e (Playwright)
  docs/specs/
```

`src/lib/` no toca el DOM ni React: recibe datos y devuelve datos. Así se prueba sola y la usan tanto las páginas de Astro como la isla.

## Pruebas

- **Vitest:** turnos (ida y vuelta de los 72 y valores conocidos), lógica del calendario (grupos por turno y precedencia), conversión de los datos manuales y datos generados (schema, ids únicos, referencias, objetivo ↔ turno de la carrera, casos conocidos).
- **Playwright:** celular de 360 px sin scroll horizontal en los 3 años; tocar un turno abre el detalle; elegir una Uma marca sus turnos; abrir `/?uma=…&turn=…` restaura el estado; valores inválidos no rompen nada; las páginas de Uma y carrera cargan.
- **`astro check`** con TypeScript estricto.
- **GitHub Actions:** todo lo anterior en cada push.

## Antes de publicar

1. Verificar con capturas los objetivos cargados.
2. Favicon propio. Sin dominio propio por ahora: el sitio vive en el subdominio de Vercel. Al crear el proyecto en Vercel, confirmar que el subdominio asignado coincide con `site` en `astro.config.mjs` (`https://uma-calendar.vercel.app`), porque de ahí sale la URL canónica; si Vercel asigna otro, cambiar `site`.
3. Créditos en la página y en el README: umamusu.wiki como fuente de las carreras y Claude en **Credits**.
4. Aviso de que es un proyecto de fans, sin relación con Cygames.
