# Diseño de KAB Centinela

Guía corta para que el tablero se vea como una sola marca. Prototipo vivo: https://claude.ai/artifact/PY2ewf2nNtizQdwHmNq1f2

**Primero, simple.** Lo usan apicultores en el campo, desde el celular. Cada pantalla tiene una acción principal, el estado se entiende en dos segundos y nada se esconde detrás de un gesto o del hover. Diseña primero para 375 px.

## Tokens (`app/globals.css`)

Todo color sale de un token de `:root`; el modo oscuro solo redefine los mismos tokens. No escribas colores sueltos en los componentes.

| Token | Uso | Claro | Oscuro |
| --- | --- | --- | --- |
| `--cera` | fondo | `#fbf4e4` | `#17110a` |
| `--cera-2` | tarjetas, superficies | `#f3e6c8` | `#241a0f` |
| `--cera-3` | bordes | `#e4d2aa` | `#3a2b19` |
| `--miel` | botón principal, acento (solo rellenos) | `#e0a12b` | `#f2b544` |
| `--miel-media` | líneas de gráfica | `#b5730f` | `#f2b544` |
| `--miel-profunda` | texto de acento, enlaces | `#8a5508` | `#f6c766` |
| `--propoleo` / `--propoleo-2` | texto / texto secundario | `#3a2414` / `#6e5440` | `#f6e9cf` / `#c9b391` |
| `--monte` | sana | `#4b6a2c` | `#a7c475` |
| `--aviso` / `--aviso-texto` | revisar (relleno / texto) | `#d98324` / `#8f4e0c` | `#f3a456` |
| `--alerta` | urgente, intoxicación | `#a63c29` | `#ee8b72` |
| `--madera`, `--lacre`, `--papel` | pasaporte, sello, expediente | | |

Todo texto pasa AA (4.5:1). `--miel` y `--aviso` no sirven para texto chico: úsalos como fondo con texto `--propoleo` encima.

## Tipografía

- **Fraunces** (`--f-titulo`): títulos, cifras grandes y el banner de estado.
- **Atkinson Hyperlegible** (`--f-texto`): todo lo demás. Está hecha para leerse con poca vista. Base de 18 px; el botón "AA" la sube a 21.
- **IBM Plex Mono** (`--f-dato`, clase `.dato`): IDs de colmena (`TEK-03`), lecturas, firmas y hashes.

## Íconos (`components/Icono.js`)

`<Icono nombre="abeja" />`, de 24 px y con trazo de 1.75. Cada uno de los 11 avisos usa su propio tipo como nombre (`<Icono nombre={alerta.tipo} />`). **Nada de emojis**, ni en la interfaz ni en los mensajes de WhatsApp.

Para agregar un ícono, añade sus trazos a `ICONOS` con el mismo grosor y las puntas redondas.

## Estados

Un estado siempre se muestra con tres cosas: color, símbolo dentro de la celda y palabra.

| Estado | Clase | Símbolo | Palabra |
| --- | --- | --- | --- |
| `sana` | `estado-bien` | palomita | Bien |
| `atencion` | `estado-atencion` | reloj | Revisar pronto |
| `alerta` | `estado-alerta` | admiración | Revisar hoy |
| `critica` | `estado-critica` | admiración + doble borde | ¡Urgente! |
| `apagada` | `estado-apagada` | celda punteada + diagonal | Sin señal |

Piezas: `IconoEstado`, `Chip` (insignia hexagonal), `.banner`, `.disco` (ícono del aviso en un hexágono).

## Forma y textura

- La forma hexagonal va solo en las piezas clave: insignias, celdas del panal, marcadores del mapa, el disco de los avisos, los pasos numerados y el sello. No la uses en todo.
- Las tarjetas son de cera (`--cera-2`), sin sombra.
- La retícula de panal y el grano viven en `body`, detrás de todo. Nunca los pongas encima del contenido.

## Movimiento

- Duran de 200 a 600 ms con la curva "miel que escurre" `--curva-miel` (`cubic-bezier(.22, 1, .36, 1)`). Sin rebotes.
- La animación nunca tapa información ni hace esperar: todo tiene que poder leerse quieto.
- Lo que se repite va en CSS: el panal que respira, las ondas del mapa, el zumbido, el llenado de miel y el brillo de los esqueletos. `motion` (con `LazyMotion`) se usa solo para el sello de lacre y el volteo del pasaporte.
- El ritmo del panal dice el estado: 4.4 s si está sana, 3.2 s si hay que revisar pronto, 2.2 s si hay que revisar hoy y 1.2 s si es urgente; sin señal, la celda queda quieta.
- La onda del mapa sale **una vez**, cuando un apiario pasa a urgente, no en cada actualización.
- Con "reducir movimiento" (`prefers-reduced-motion`) solo quedan cambios de opacidad; `MotionConfig reducedMotion="user"` lo aplica a `motion`.
- Hay una sola abeja (`components/Abeja.js`), en la portada de "El problema" y en los estados vacíos, y siempre en su propio carril.

## Cargas

`<Cargando />` muestra una celda que se llena de miel y esqueletos con brillo ámbar. No uses spinners.
