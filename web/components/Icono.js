// Íconos de KAB Centinela (nada de emojis): 24x24, trazo 1.75, puntas redondas.
// Cada uno es una lista de elementos SVG; el componente pone el trazo y el tamaño.

const HEX = "M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z";
const GOTA = "M12 3.2c-2.6 3.3-6 7.4-6 11.1a6 6 0 0 0 12 0c0-3.7-3.4-7.8-6-11.1z";
const p = (d) => <path d={d} />;
const punto = (cx, cy, r = 0.9) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;

function petalos(cx, cy, r, n = 5) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    const ax = cx + Math.cos(a - 0.55) * r * 0.75, ay = cy + Math.sin(a - 0.55) * r * 0.75;
    const bx = cx + Math.cos(a + 0.55) * r * 0.75, by = cy + Math.sin(a + 0.55) * r * 0.75;
    return <path key={i} d={`M${cx} ${cy}Q${ax.toFixed(2)} ${ay.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}Q${bx.toFixed(2)} ${by.toFixed(2)} ${cx} ${cy}`} />;
  });
}

export const ICONOS = {
  // mundo apícola
  celda: p(HEX),
  abeja: <>
    <circle cx="12" cy="7.3" r="1.9" />
    <ellipse cx="12" cy="14.6" rx="3.8" ry="5.2" />
    {p("M8.4 13h7.2M8.6 16.2h6.8M12 19.8v1.7M11 5.7 9.7 3.4M13 5.7l1.3-2.3")}
    {p("M8.6 10.6C6.5 7.4 3 8.3 3.6 10.6c.5 1.8 3.3 1.9 5 1.1M15.4 10.6c2.1-3.2 5.6-2.3 5 0-.5 1.8-3.3 1.9-5 1.1")}
  </>,
  gota: <>{p(GOTA)}{p("M9.2 14.6a2.8 2.8 0 0 0 2.8 2.8")}</>,
  colmena: <>{p("M3.5 6.5h17l-1 3h-15zM4.5 9.5h15v11h-15zM4.5 15h15M10 18.2h4")}</>,
  ahumador: <>
    {p("M7 10.5h7v9.5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM7.6 10.5 9.2 7h2.6l1.6 3.5")}
    {p("M14 13.5l4.8-1.8 1.2 5.6-6 .9")}
    {p("M10.5 5.2c-.9-.9.1-1.9-.3-2.7M13 5c.6-.8 1.6-.6 1.8-1.6")}
  </>,
  flor: <>{petalos(12, 8.6, 5)}{p("M12 13.5V21M12 17.6c1.8-1.9 4.2-2 5-1.4-.6 1.9-3 2.5-5 1.4")}</>,
  termometro: <>{p("M10 4.5a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0zM12 9v8")}{punto(12, 17.2, 1.4)}</>,
  onda: p("M3.5 10.5v3M7 7.5v9M10.5 4v16M14 7v10M17.5 9.5v5M21 11v2"),
  sello: <>{p(HEX)}{p("M12 7.6l3.8 2.2v4.4L12 16.4l-3.8-2.2V9.8z")}</>,
  escudo: <>{p("M12 3l7.5 3v5.6c0 4.7-3.2 8.5-7.5 10.4-4.3-1.9-7.5-5.7-7.5-10.4V6z")}{p("M8.8 12.1l2.2 2.2 4.3-4.5")}</>,
  qr: <>
    {p("M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z")}
    {p("M14 14h2.5v2.5H14zM18.5 18.5H20V20h-1.5zM14 19.5h2M19.5 14v2.5")}
    {punto(7, 7, 0.8)}{punto(17, 7, 0.8)}{punto(7, 17, 0.8)}
  </>,
  frasco: <>{p("M6.5 5h11v3h-11zM7 8h10v10.5a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 18.5z")}{p("M7 12.6c1.7.9 3.3-.9 5 0s3.3.9 5 0")}</>,

  // los 11 avisos
  INTOXICACION: <>
    {p("M8 10.5h7v9.8a.9.9 0 0 1-.9.9H8.9a.9.9 0 0 1-.9-.9zM9.6 10.5V7.4h3.8v3.1M13.4 7.4h2.4l1.2-1.6M9.6 7.4 7.2 8.9")}
    {p("M10 14.3l3 3M13 14.3l-3 3")}
    {punto(19.4, 4.2, 0.8)}{punto(20.8, 6.6, 0.8)}{punto(19.2, 8.4, 0.8)}
  </>,
  BROTE_REGIONAL: <>
    {p("M12 3.2v11.3M3.5 8.8h17M9 13.6h6")}
    {p("M12 3.2c.9 0 1.3.8 1.3 1.8v8.5")}
    {punto(5.5, 17.8)}{punto(8.7, 20.2)}{punto(12, 17.8)}{punto(15.3, 20.2)}{punto(18.5, 17.8)}
  </>,
  GOLPE_CALOR: <>
    <circle cx="12" cy="12" r="4" />
    {p("M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7")}
  </>,
  SEQUIA: <>{p(GOTA)}{p("M4 4.5l16 16")}</>,
  FRIO_EXTREMO: <>
    {p("M12 2.8v18.4M4 7.4l16 9.2M4 16.6l16-9.2")}
    {p("M9.6 3.9 12 6l2.4-2.1M9.6 20.1 12 18l2.4 2.1M3.9 10.4l3.1-.7-1-3M20.1 13.6l-3.1.7 1 3M3.9 13.6l3.1.7-1 3M20.1 10.4l-3.1-.7 1-3")}
  </>,
  HAMBRUNA: <>
    {p("M7.5 21c0-5.6 2.4-9.6 7.2-10.6")}
    <circle cx="16.6" cy="12.6" r="2.1" />
    {p("M15.3 14.6l-.9 2.9M17.6 14.7l.6 2.8M18.6 12.2l2.4 1.2M9.4 16.2c-1.8-.6-3.2-.2-3.9.8 1.4.9 3 .7 3.9-.8")}
    {p("M5.2 6.3c.8-1.3 2.2-1.6 2.8-1 0 1.2-1.6 2-2.8 1z")}
  </>,
  AUSENCIA_REINA: p("M4.2 18.5h15.6M4.2 18.5 3 8.2l5.1 4.2L12 5l3.9 7.4L21 8.2l-1.2 10.3M12 14.6v.1"),
  ENJAMBRAZON: <>
    {p("M7.4 12.2l3.8 2.2v4.4l-3.8 2.2-3.8-2.2v-4.4z")}
    {p("M9.8 9.6C12 5.8 15.6 3.6 20.5 3.4")}
    <circle cx="13.6" cy="9.4" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16.6" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="19.8" cy="5.6" r="1.1" fill="currentColor" stroke="none" />
  </>,
  VARROA_ENFERMEDAD: <>
    <ellipse cx="12" cy="13.4" rx="5" ry="4.2" />
    {p("M10 9.4c1.2-1.3 2.8-1.3 4 0M7.4 11.4 4.4 9.6M7 13.4H3.6M7.4 15.4l-3 1.8M16.6 11.4l3-1.8M17 13.4h3.4M16.6 15.4l3 1.8")}
  </>,
  DESCONEXION: <>{p("M12 12.5V21M8.5 21h7M8.4 8.6a5 5 0 0 0 0 7M15.6 8.6a5 5 0 0 1 0 7M5.6 5.8a9 9 0 0 0 0 12.6M18.4 5.8a9 9 0 0 1 0 12.6")}{p("M3.5 3.5l17 17")}</>,
  BATERIA_BAJA: <>{p("M3.5 8h15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 2 14.5v-5A1.5 1.5 0 0 1 3.5 8zM22 11v2")}<rect x="4.2" y="10.2" width="3" height="3.6" rx=".5" fill="currentColor" stroke="none" /></>,

  // indicadores de la colmena
  peso: <>{p("M4.5 20.5h15l-2.2-10.5H6.7z")}<circle cx="12" cy="6.4" r="2.4" />{p("M12 13.5l2.2-1.6")}</>,
  humedad: <>{p(GOTA)}{p("M9.5 16.5l5-5")}{punto(9.8, 12, 0.9)}{punto(14.2, 16.2, 0.9)}</>,

  // interfaz
  campana: p("M6 16.2V11a6 6 0 0 1 12 0v5.2l1.6 2.1H4.4zM10 20.8h4"),
  bocina: p("M4 9.5h3.5L12 5.8v12.4l-4.5-3.7H4zM15.5 9a4 4 0 0 1 0 6M18 6.4a7.6 7.6 0 0 1 0 11.2"),
  detener: <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" />,
  mensaje: <>{p("M4.6 19.6l1.2-3.7A7.9 7.9 0 1 1 8.6 18.7z")}{punto(8.6, 12)}{punto(12, 12)}{punto(15.4, 12)}</>,
  telefono: p("M5.2 3.8h3l1.6 4.1-2 1.3a10.4 10.4 0 0 0 5 5l1.3-2 4.1 1.6v3a1.9 1.9 0 0 1-2.1 1.9A15.6 15.6 0 0 1 3.3 5.9a1.9 1.9 0 0 1 1.9-2.1z"),
  copiar: <>{p("M9.5 8.5h9a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 19v-9a1.5 1.5 0 0 1 1.5-1.5z")}{p("M16 8.5V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8")}</>,
  imprimir: p("M7 9V4h10v5M5.5 9h13A1.5 1.5 0 0 1 20 10.5v5a1.5 1.5 0 0 1-1.5 1.5H17M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9M7 14h10v6.5H7z"),
  lupa: <><circle cx="10.5" cy="10.5" r="6" />{p("M15 15l5 5")}</>,
  candado: <>{p("M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V12a1.5 1.5 0 0 1 1.5-1.5zM8 10.5V7.6a4 4 0 0 1 8 0v2.9M12 14.4v2.6")}</>,
  volver: p("M19.5 12H5M11 6l-6 6 6 6"),
  ayuda: <><circle cx="12" cy="12" r="9" />{p("M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.7v.4")}{punto(12, 16.9, 1)}</>,
  ubicacion: <>{p("M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z")}<circle cx="12" cy="10" r="2.3" /></>,
  check: p("M5 12.5l4.5 4.5L19 7.5"),
  descargar: p("M12 4v11M7 10.5l5 5 5-5M5 20h14"),
  ojo: <>{p("M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z")}<circle cx="12" cy="12" r="3" /></>,
  lapiz: p("M15.2 4.4l4.4 4.4L9 19.4H4.6V15zM13 6.6l4.4 4.4"),
  voltear: p("M4 12a8 8 0 0 1 14-5.3M18.5 3v4h-4M20 12a8 8 0 0 1-14 5.3M5.5 21v-4h4"),
  reloj: <><circle cx="12" cy="12" r="9" />{p("M12 7.2V12l3.2 2")}</>,
  letra: p("M3 19 7.5 7l4.5 12M4.6 15h5.8M14 19l3.3-8.6 3.2 8.6M15.2 16.2h4.3"),
};

/** <Icono nombre="abeja" />. Con `titulo` se anuncia al lector de pantalla; sin él es decorativo. */
export default function Icono({ nombre, tam = 24, titulo, className, grosor = 1.75 }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} className={className} fill="none" stroke="currentColor"
      strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round"
      role={titulo ? "img" : undefined} aria-label={titulo} aria-hidden={titulo ? undefined : true} focusable="false">
      {ICONOS[nombre] ?? ICONOS.celda}
    </svg>
  );
}
