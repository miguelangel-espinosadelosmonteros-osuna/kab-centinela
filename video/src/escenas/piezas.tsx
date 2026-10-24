// Piezas que comparten las escenas. Todo se anima con el cuadro actual (nada de CSS animations).
import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import IconoWeb from "../../../web/components/Icono";
import LogoWeb from "../../../web/components/Logo";
import { C, DATO, MIEL, TEXTO, TITULO, fijo } from "../marca";

// los mismos componentes de la app (web/components), con tipos
export const Icono = IconoWeb as React.FC<{ nombre: string; tam?: number; grosor?: number; titulo?: string; className?: string }>;
export const Logo = LogoWeb as React.FC<{ tam?: number; titulo?: string }>;

const HEX = "50,2 96,27 96,79 50,104 4,79 4,27";

/** Titular de escena: aparece subiendo; el subtítulo entra un poco después. */
export const Titular: React.FC<{ titulo: string; sub?: string; color?: string; subColor?: string; desde?: number; ancho?: number }> = ({
  titulo, sub, color = C.propoleo, subColor = C.propoleo2, desde = 0, ancho = 1300,
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 110, top: 96, width: ancho }}>
      <div style={{
        fontFamily: TITULO, fontWeight: 600, fontSize: 88, lineHeight: 1.05, letterSpacing: "-0.015em", color,
        opacity: interpolate(f, [desde, desde + 14], [0, 1], fijo),
        translate: `0px ${interpolate(f, [desde, desde + 18], [24, 0], { ...fijo, easing: MIEL })}px`,
      }}>{titulo}</div>
      {sub && (
        <div style={{
          fontFamily: TEXTO, fontSize: 44, lineHeight: 1.3, color: subColor, marginTop: 18,
          opacity: interpolate(f, [desde + 10, desde + 24], [0, 1], fijo),
        }}>{sub}</div>
      )}
    </div>
  );
};

/** Celda de colmena como en el tablero: respira al ritmo de su estado. */
export const CeldaColmena: React.FC<{ id: string; urgente: number; ancho?: number }> = ({ id, urgente, ancho = 190 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // urgente: 0 = sana, 1 = urgente (se puede interpolar para el cambio)
  const ritmo = urgente > 0.5 ? 1.15 : 4.4;
  const amp = urgente > 0.5 ? 0.045 : 0.022;
  const respira = 1 + amp * Math.max(0, Math.sin((2 * Math.PI * f) / (ritmo * fps)));
  const capa = (estado: "sana" | "critica", opacidad: number) => (
    <div style={{ position: "absolute", inset: 0, opacity: opacidad, display: "grid", placeItems: "center" }}>
      <svg viewBox="0 0 100 106" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <polygon points={HEX} fill={estado === "sana" ? C.monteFondo : C.alertaFondo} stroke={estado === "sana" ? C.monte : C.alerta} strokeWidth={estado === "sana" ? 3 : 5} />
      </svg>
      <div style={{ position: "relative", display: "grid", justifyItems: "center", gap: 2, color: C.propoleo }}>
        <span style={{ color: estado === "sana" ? C.monte : C.alerta, display: "grid" }}>
          <Icono nombre={estado === "sana" ? "check" : "INTOXICACION"} tam={ancho * 0.26} grosor={2} />
        </span>
        <span style={{ fontFamily: DATO, fontWeight: 500, fontSize: ancho * 0.15 }}>{id}</span>
        <span style={{ fontFamily: TEXTO, fontWeight: 700, fontSize: ancho * 0.115 }}>{estado === "sana" ? "Bien" : "¡Urgente!"}</span>
      </div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: ancho, height: ancho * 1.06, scale: String(respira) }}>
      {capa("sana", 1 - urgente)}
      {capa("critica", urgente)}
    </div>
  );
};

/** Onda del zumbido hecha con dB y Hz, igual que en la app. `fase` la hace correr. */
export function onda(db: number, hz: number, fase: number, ancho = 760, alto = 220) {
  const a = Math.max(6, Math.min(alto * 0.42, 6 + ((db - 50) / 25) * alto * 0.4));
  const n = Math.max(4, Math.round(hz / 32));
  let d = "";
  for (let x = 0; x <= ancho; x += 3) {
    const k = (2 * Math.PI * n * x) / ancho;
    const env = 0.72 + 0.28 * Math.sin((2 * Math.PI * x) / ancho);
    const y = alto / 2 - a * env * (0.62 * Math.sin(k + fase) + 0.28 * Math.sin(2 * k + 1.3 + fase) + 0.1 * Math.sin(5 * k));
    d += `${x ? "L" : "M"}${x} ${y.toFixed(1)}`;
  }
  return d;
}

/** Celda que se llena de miel (para la verificación). `lleno` va de 0 a 1. */
export const CeldaMiel: React.FC<{ lleno: number; check: number; tam?: number }> = ({ lleno, check, tam = 120 }) => (
  <svg width={tam} height={tam * 1.06} viewBox="0 0 100 106">
    <defs><clipPath id="celda-miel"><polygon points={HEX} /></clipPath></defs>
    <polygon points={HEX} fill={C.noche2} />
    <rect clipPath="url(#celda-miel)" x="0" y={106 * (1 - lleno)} width="100" height="106" fill={C.miel} />
    <polygon points={HEX} fill="none" stroke={C.polen} strokeWidth="4" />
    <path d="M30 55l14 14 28-30" fill="none" stroke={C.propoleo} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray="1" strokeDashoffset={1 - check} />
  </svg>
);
