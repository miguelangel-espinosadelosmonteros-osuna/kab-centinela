"use client";

import Icono from "@/components/Icono";

/**
 * Dibujo del zumbido hecho con el volumen (dB) y el tono (Hz) que manda el sensor.
 * No es audio grabado. Cuando la colmena casi no zumba, la onda se aplana y va lenta.
 */
export default function Zumbido({ db, hz, base }) {
  if (db == null) return null;
  const a = Math.max(4, Math.min(46, 4 + ((db - 50) / 25) * 42));
  const n = Math.max(4, Math.round((hz || 250) / 32));
  const tira = (fase, escala) => {
    let d = "";
    for (let x = 0; x <= 640; x += 2) {
      const k = (2 * Math.PI * n * x) / 320;
      const env = 0.72 + 0.28 * Math.sin((2 * Math.PI * x) / 320 + fase);
      const y = 60 - a * escala * env * (0.62 * Math.sin(k + fase) + 0.28 * Math.sin(2 * k + 1.3) + 0.1 * Math.sin(5 * k));
      d += `${x ? "L" : "M"}${x} ${y.toFixed(1)}`;
    }
    return d;
  };
  const bajo = base != null && base - db > 8;
  return (
    <div className="zumbido">
      <svg viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2="320" y1="60" y2="60" stroke="#3a2b19" />
        <g className="tira" style={{ "--vel": bajo ? "5s" : "2.4s" }}>
          <path d={tira(1.1, 0.7)} fill="none" stroke="#b5730f" strokeWidth="1" opacity=".55" />
          <path d={tira(0, 1)} fill="none" stroke="#f2b544" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </svg>
      <span className="aclaracion"><Icono nombre="onda" tam={16} />Dibujo hecho con el volumen y el tono que mide el sensor.</span>
    </div>
  );
}
