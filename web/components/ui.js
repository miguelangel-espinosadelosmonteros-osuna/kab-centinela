"use client";

export const NOMBRE_ESTADO = { sana: "Sana", atencion: "Atención", alerta: "Alerta", critica: "Crítica" };

export function Insignia({ valor, texto }) {
  return <span className={`insignia ${valor}`}>{texto || NOMBRE_ESTADO[valor] || valor}</span>;
}

export function hora(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("es-MX", { timeZone: "America/Merida", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
}

export function num(v, dec = 1, unidad = "") {
  return v === null || v === undefined ? "—" : `${Number(v).toFixed(dec)}${unidad}`;
}

/** Gráfica de línea mínima en SVG (sin librerías). */
export function Linea({ valores, color = "var(--miel)" }) {
  const v = valores.filter((x) => x !== null && x !== undefined);
  if (v.length < 2) return <svg viewBox="0 0 100 30" />;
  const min = Math.min(...v), max = Math.max(...v), rango = max - min || 1;
  const puntos = v.map((y, i) => `${(i / (v.length - 1)) * 100},${28 - ((y - min) / rango) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" role="img">
      <polyline points={puntos} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Cargando({ error }) {
  if (error) return <div className="error">No se pudo leer la API: {error}</div>;
  return <p className="sub">Cargando…</p>;
}
