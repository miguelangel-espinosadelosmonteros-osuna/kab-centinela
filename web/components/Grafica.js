"use client";

import { useRef, useState } from "react";
import { fecha, hace, num } from "@/components/ui";

const hora = fecha;

const W = 340, H = 150, IZQ = 34, DER = 52, ARR = 12, ABA = 26;

function redondo(v, dec) {
  const f = 10 ** dec;
  return Math.round(v * f) / f;
}

/**
 * Gráfica de una sola serie (línea de 2 px + lavado al 10%) con franja del rango sano.
 * Toca o desliza el dedo para ver cada lectura. Debajo, la tabla con los números.
 */
export default function Grafica({ datos, banda, unidad = "", dec = 1, nombre }) {
  const caja = useRef(null);
  const [activo, setActivo] = useState(null);
  const puntos = datos.filter((d) => d.v !== null && d.v !== undefined);
  if (puntos.length < 2) return <p className="chico">Todavía no hay suficientes lecturas.</p>;

  const valores = puntos.map((d) => d.v).concat(banda || []);
  let min = Math.min(...valores), max = Math.max(...valores);
  const margen = (max - min || 1) * 0.12;
  min -= margen; max += margen;

  const x = (i) => IZQ + (i / (puntos.length - 1)) * (W - IZQ - DER);
  const y = (v) => ARR + (1 - (v - min) / (max - min)) * (H - ARR - ABA);
  const linea = puntos.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join("");
  const area = `${linea}L${x(puntos.length - 1).toFixed(1)},${H - ABA}L${IZQ},${H - ABA}Z`;
  const ticks = [min + margen, (min + max) / 2, max - margen].map((t) => redondo(t, dec));
  const ultimo = puntos[puntos.length - 1];

  function mover(e) {
    const r = caja.current.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((vx - IZQ) / (W - IZQ - DER)) * (puntos.length - 1));
    setActivo(Math.max(0, Math.min(puntos.length - 1, i)));
  }

  const a = activo !== null ? puntos[activo] : null;

  return (
    <div className="grafica">
      <svg ref={caja} viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`${nombre}: ahora ${num(ultimo.v, dec)} ${unidad}`}
        onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setActivo(null)}>
        {banda && (
          <rect x={IZQ} width={W - IZQ - DER} y={y(banda[1])} height={Math.max(0, y(banda[0]) - y(banda[1]))} fill="var(--banda)" />
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={IZQ} x2={W - DER} y1={y(t)} y2={y(t)} stroke="var(--borde)" strokeWidth="1" />
            <text x={IZQ - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--texto-3)">{num(t, dec)}</text>
          </g>
        ))}
        <line x1={IZQ} x2={W - DER} y1={H - ABA} y2={H - ABA} stroke="var(--eje)" strokeWidth="1" />
        <text x={IZQ} y={H - 8} fontSize="11" fill="var(--texto-3)">{hace(puntos[0].ts)}</text>
        <text x={W - DER} y={H - 8} fontSize="11" fill="var(--texto-3)" textAnchor="end">{hace(ultimo.ts)}</text>
        <path d={area} fill="var(--serie)" opacity="0.1" />
        <path d={linea} fill="none" stroke="var(--serie)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(puntos.length - 1)} cy={y(ultimo.v)} r="5" fill="var(--serie)" stroke="var(--superficie)" strokeWidth="2" />
        <text x={x(puntos.length - 1) + 9} y={y(ultimo.v) + 4} fontSize="12" fontWeight="700" fill="var(--texto)">
          {num(ultimo.v, dec)}
        </text>
        {a && (
          <g>
            <line x1={x(activo)} x2={x(activo)} y1={ARR} y2={H - ABA} stroke="var(--texto-3)" strokeWidth="1" />
            <circle cx={x(activo)} cy={y(a.v)} r="5" fill="var(--serie)" stroke="var(--superficie)" strokeWidth="2" />
          </g>
        )}
        {/* área de toque más grande que la línea */}
        <rect x={IZQ} y={0} width={W - IZQ - DER} height={H} fill="transparent" />
      </svg>
      {a && (
        <div className="tip" style={{ left: `${(x(activo) / W) * 100}%` }}>
          <b>{num(a.v, dec)} {unidad}</b>{hora(a.ts)}
        </div>
      )}
      {banda && <div className="leyenda-banda"><i aria-hidden="true" />Franja gris = lo normal ({num(banda[0], dec)} a {num(banda[1], dec)} {unidad})</div>}
      <details>
        <summary>Ver los números</summary>
        <table className="tabla">
          <thead><tr><th>Hora</th><th style={{ textAlign: "right" }}>{nombre} ({unidad})</th></tr></thead>
          <tbody>
            {puntos.slice(-12).reverse().map((d) => (
              <tr key={d.ts}><td>{hora(d.ts)}</td><td className="num">{num(d.v, dec)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
