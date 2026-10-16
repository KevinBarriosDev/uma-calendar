# CLAUDE.md (uma-calendar)

**Uma Calendar**: web pública con el calendario de carreras de la carrera (servidor **Global**). Astro + TypeScript estricto; el calendario es una isla de React. Diseño en `docs/specs/`.

## Reglas

1. **La interfaz va en inglés.** Comentarios, docs internas y commits, en español.
2. **Solo Global** y solo turnos 1 a 72.
3. **Nada de assets de Cygames ni de terceros sin permiso** (imágenes, íconos, logos, fuentes).
4. `src/lib/` es pura: nada de React, Astro ni DOM.
5. **Los datos se cargan a mano en `data/manual/`** y `npm run data:build` los valida y genera `src/data/*.json` (esos no se editan). Si el build corta, el mensaje dice archivo, Uma o carrera y campo.
6. Celular primero: a 360 px no hay scroll horizontal.
7. Antes de dar algo por terminado: `npm run check && npm test && npm run e2e`.
8. Commits a nombre del usuario, sin `Co-Authored-By` ni menciones de IA. El crédito a Claude va en **Credits** del README.

## Datos

- **Carreras**: tabla "G1 Races Calendar" de [umamusu.wiki](https://umamusu.wiki) (CC BY-SA 4.0), cargada a mano en `data/manual/races.json` (`year` 1-3, `month`, `half` `early`/`late`; la categoría se deriva de `distance`).
- **Objetivos de las Umas**: los carga el autor a mano en `data/manual/characters.json`. Los objetivos van en orden (la posición es el `order`); las alternativas son `alternatives: [{ when, races }]`. Los objetivos son por Uma (las versiones comparten objetivos).
- **Cargar una Uma**: agregar la entrada en `characters.json` con `"verificar": true` en cada objetivo, correr `npm run data:build` y revisar el diff de `src/data/`.
- **Regla `verificar`**: un objetivo o carrera queda en `true` hasta confirmarlo con capturas del juego (carpeta `capturas/` de la raíz de Uma, que no se sube). Solo entonces pasa a `false`. El sitio marca lo no verificado con "unverified".
- **Fuentes prohibidas**: no se copian datos de sitios sin permiso explícito; la fuente anterior se descartó por eso. Los archivos de datos van bajo CC BY-SA 4.0 (ver `DATA-LICENSE`).
