"use client";

import { ESTADOS, SEVERIDAD_A_ESTADO } from "@/lib/textos";

export const claseEstado = (estado) => `estado-${estado === "sana" ? "bien" : estado || "bien"}`;
export const estadoDeSeveridad = (sev) => SEVERIDAD_A_ESTADO[sev] || "atencion";

/** Ícono de estado: cada estado tiene su FORMA (no solo su color). */
export function IconoEstado({ estado = "sana", titulo, tam }) {
  const t = titulo || ESTADOS[estado]?.palabra;
  const medida = tam ? { width: tam, height: tam, style: { flex: "none" } } : {};
  if (estado === "sana") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-label={t} {...medida}>
        <circle cx="12" cy="12" r="11" fill="var(--bien)" />
        <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (estado === "critica") {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-label={t} {...medida}>
        <path d="M8 1h8l7 7v8l-7 7H8l-7-7V8z" fill="var(--urgente)" />
        <path d="M12 6v7.5" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="12" cy="17.6" r="1.7" fill="#fff" />
      </svg>
    );
  }
  const relleno = estado === "alerta" ? "var(--serio)" : "var(--aviso)";
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={t} {...medida}>
      <path d="M12 1.5L23 21.5H1z" fill={relleno} strokeLinejoin="round" />
      <path d="M12 8.5v6" stroke="#1b1813" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1.5" fill="#1b1813" />
    </svg>
  );
}

export function Chip({ estado, texto }) {
  return (
    <span className={`chip ${claseEstado(estado)}`}>
      <IconoEstado estado={estado} />
      {texto || ESTADOS[estado]?.palabra}
    </span>
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
  return <p className="sub" style={{ padding: "24px 0" }}>Cargando…</p>;
}

/** Hora del día en Mérida para saludar. */
export function saludo() {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/Merida", hour: "numeric", hour12: false }));
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}
