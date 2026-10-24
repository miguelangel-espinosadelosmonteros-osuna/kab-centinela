// Marca de KAB Centinela para el video: los mismos valores que web/app/globals.css.
import { loadFont as fraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as atkinson } from "@remotion/google-fonts/AtkinsonHyperlegible";
import { loadFont as plex } from "@remotion/google-fonts/IBMPlexMono";
import { Easing } from "remotion";
import DEMO from "../../web/lib/demo-datos.json";

export const TITULO = fraunces("normal", { weights: ["400", "600", "700"], subsets: ["latin"] }).fontFamily;
fraunces("italic", { weights: ["400"], subsets: ["latin"] });
export const TEXTO = atkinson("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;
export const DATO = plex("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily;

export const C = {
  cera: "#fbf4e4", cera2: "#f3e6c8", cera3: "#e4d2aa",
  miel: "#e0a12b", mielMedia: "#b5730f", mielProfunda: "#8a5508", polen: "#f2c94c",
  propoleo: "#3a2414", propoleo2: "#6e5440", madera: "#9c6b3c", lacre: "#8e2b1e", papel: "#fffbf2",
  noche: "#17110a", noche2: "#241a0f", crema: "#f6e9cf", crema2: "#c9b391",
  monte: "#4b6a2c", monteFondo: "#e3ead0", alerta: "#a63c29", alertaFondo: "#f3d5cb",
};

// variables que leen el logo (Logo.js) en fondo claro y oscuro
export const VARS_CLARO = { "--logo-vacio": C.cera, "--logo-trazo": C.propoleo } as React.CSSProperties;
export const VARS_OSCURO = { "--logo-vacio": C.noche2, "--logo-trazo": C.crema } as React.CSSProperties;

export const MIEL = Easing.bezier(0.22, 1, 0.36, 1); // "miel que escurre"
export const fijo = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- datos del modo demo (simulador): los mismos que se ven en el tablero
const lect = (DEMO as any).lecturas["TEK-01"] as { sonido_db: number; peso_kg: number; sonido_hz: number }[];
const exp = (DEMO as any).expedientes.find((e: any) => e.colmena_id === "TEK-01") ?? (DEMO as any).expedientes[0];
const brote = (DEMO as any).alertas.find((a: any) => a.tipo === "BROTE_REGIONAL");
const m = exp.sobre.documento.alerta.metricas;
export const DATOS = {
  dbAntes: Math.round(m.sonido_base_db),
  dbAhora: Math.round(m.sonido_actual_db),
  pesoAntes: m.peso_base_kg as number,
  pesoAhora: m.peso_actual_kg as number,
  hzAhora: lect[lect.length - 1].sonido_hz,
  huella: exp.sobre.firma.digest_sha256 as string,
  expediente: exp.doc_id as string,
  km: brote.metricas.distancia_max_km as number,
  colmenasA: ((DEMO as any).colmenas as any[]).filter((c) => c.apiario_id === "TEK-NOH-A").map((c) => c.colmena_id as string),
  colmenasB: ((DEMO as any).colmenas as any[]).filter((c) => c.apiario_id === "TEK-NOH-B").map((c) => c.colmena_id as string),
};
