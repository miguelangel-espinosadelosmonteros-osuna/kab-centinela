"use client";

import { useId } from "react";
import { ESTADOS, SEVERIDAD_A_ESTADO } from "@/lib/textos";

export const claseEstado = (estado) => `estado-${estado === "sana" ? "bien" : estado || "bien"}`;
export const estadoDeSeveridad = (sev) => SEVERIDAD_A_ESTADO[sev] || "atencion";

const HEX = "M12 1.6l9 5.2v10.4l-9 5.2-9-5.2V6.8z";

/** Ícono de estado: la misma celda con distinto símbolo adentro (no solo color). */
export function IconoEstado({ estado = "sana", titulo, tam }) {
  const t = titulo ?? ESTADOS[estado]?.palabra; // titulo="" = decorativo (ya hay palabra al lado)
  const medida = tam ? { width: tam, height: tam, style: { flex: "none" } } : {};
  const apagada = estado === "apagada";
  return (
    <svg viewBox="0 0 24 24" className={claseEstado(estado)} {...(t ? { role: "img", "aria-label": t } : { "aria-hidden": true })} {...medida}>
      {apagada
        ? <path d="M12 2.2l8.5 4.9v9.8L12 21.8l-8.5-4.9V7.1z" fill="none" stroke="var(--c)" strokeWidth="2" strokeDasharray="3 2.5" />
        : <path d={HEX} fill="var(--c)" />}
      <g fill="none" stroke={apagada ? "var(--c-texto)" : "var(--sobre-estado)"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {estado === "sana" && <path d="M7.6 12.3l3 3 5.8-6.2" />}
        {estado === "atencion" && <path d="M12 7.6V12l2.8 1.8" />}
        {(estado === "alerta" || estado === "critica") && <path d="M12 6.8v6.4M12 16.9v.1" />}
        {apagada && <path d="M8.6 8.6l6.8 6.8" />}
      </g>
      {estado === "critica" && <path d={HEX} fill="none" stroke="var(--sobre-estado)" strokeWidth="1" transform="translate(12 12) scale(.78) translate(-12 -12)" />}
    </svg>
  );
}

export function Chip({ estado, texto, fuerte }) {
  return (
    <span className={`chip ${claseEstado(estado)}${fuerte ? " fuerte" : ""}`}>
      <IconoEstado estado={estado} titulo="" />
      {texto || ESTADOS[estado]?.palabra}
    </span>
  );
}

const HEX_CELDA = "50,2 96,27 96,79 50,104 4,79 4,27";

/** Celda que se llena de miel. `continuo` para cargas; `lleno` + `check` para "verificado". */
export function CeldaMiel({ tam = 56, continuo, lleno, check }) {
  const id = `celda-${useId().replace(/:/g, "")}`;
  return (
    <svg width={tam} height={tam * 1.06} viewBox="0 0 100 106" aria-hidden="true" style={{ flex: "none" }}>
      <defs><clipPath id={id}><polygon points={HEX_CELDA} /></clipPath></defs>
      <polygon points={HEX_CELDA} fill="var(--cera-2)" />
      <g clipPath={`url(#${id})`}>
        <rect className={continuo ? "miel-sube" : undefined} x="0" width="100" height="106" fill="var(--miel)"
          style={continuo ? undefined : { transform: `translateY(${lleno ? 0 : 106}px)`, transition: "transform .9s var(--curva-miel)" }} />
      </g>
      <polygon points={HEX_CELDA} fill="none" stroke="var(--miel-profunda)" strokeWidth="4" />
      {check && <path className="trazo-check" d="M30 55l14 14 28-30" fill="none" stroke="#3a2414" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />}
    </svg>
  );
}

export function hace(ts) {
  if (!ts) return "—";
  const seg = (Date.now() - new Date(ts).getTime()) / 1000;
  if (seg < 0) return "ahora";
  if (seg < 90) return "hace un momento";
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "hace 1 hora" : `hace ${h} horas`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export function fecha(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-MX", {
    timeZone: "America/Merida", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}

export function hora(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("es-MX", { timeZone: "America/Merida", hour: "numeric", minute: "2-digit" });
}

export function num(v, dec = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return Number(v).toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function Cargando({ error, recargar }) {
  if (error) {
    return (
      <div className="error">
        No pudimos traer los datos. Revisa tu señal de internet.
        {recargar && <div><button className="boton" style={{ marginTop: 10 }} onClick={recargar}>Intentar de nuevo</button></div>}
      </div>
    );
  }
  return (
    <div className="cargando" role="status">
      <CeldaMiel continuo tam={64} />
      Cargando…
      <div className="esqueleto" aria-hidden="true"><i style={{ width: "60%" }} /><i className="alto" /><i style={{ width: "85%" }} /></div>
    </div>
  );
}

/** Hora del día en Mérida para saludar. */
export function saludo() {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/Merida", hour: "numeric", hour12: false }));
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}
