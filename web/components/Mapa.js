"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { claseEstado } from "@/components/ui";
import { ESTADOS } from "@/lib/textos";

// Marcador hexagonal: misma celda y mismo símbolo que IconoEstado, como texto para Leaflet
const GLIFO = {
  sana: '<path d="M7.6 12.3l3 3 5.8-6.2"/>',
  atencion: '<path d="M12 7.6V12l2.8 1.8"/>',
  alerta: '<path d="M12 6.8v6.4M12 16.9v.1"/>',
  critica: '<path d="M12 6.8v6.4M12 16.9v.1"/>',
};
const hexSvg = (estado) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6l9 5.2v10.4l-9 5.2-9-5.2V6.8z" fill="var(--c)"/>` +
  `<g fill="none" stroke="var(--sobre-estado)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${GLIFO[estado] || GLIFO.sana}</g></svg>`;

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Mapa de apiarios con OpenStreetMap. Cada apiario lleva celda + nombre.
 * Cuando un apiario pasa a urgente, sale una onda terracota; si es fumigación en la zona,
 * la onda llega después a los apiarios vecinos del brote. Alrededor de lo urgente queda el radio de 3 km.
 */
export default function Mapa({ apiarios, brotes = [], alTocar, alto = 280 }) {
  const div = useRef(null);
  const mapa = useRef(null);
  const encuadrado = useRef(false);
  const antes = useRef({}); // estado anterior de cada apiario: la onda solo sale cuando algo cambia

  useEffect(() => {
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !div.current) return;
      if (!mapa.current) {
        mapa.current = L.map(div.current, { scrollWheelZoom: false, attributionControl: true });
        // De lejos solo celdas (los nombres se enciman); al acercar aparecen los nombres
        const nombres = () => div.current?.classList.toggle("lejos", mapa.current.getZoom() < 10);
        mapa.current.on("zoomend", nombres);
        mapa.current.whenReady(nombres);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa.current);
      }
      const m = mapa.current;
      m.eachLayer((capa) => { if (!(capa instanceof L.TileLayer)) m.removeLayer(capa); });

      // orden de la onda en un brote: primero el que avisó primero
      const turno = {};
      for (const b of brotes) b.forEach((id, i) => { turno[id] = Math.min(turno[id] ?? 9, i); });

      const puntos = [];
      for (const a of apiarios) {
        if (a.lat == null || a.lon == null) continue;
        puntos.push([a.lat, a.lon]);
        if (a.estado === "critica") {
          L.circle([a.lat, a.lon], { radius: 3000, color: "#a63c29", weight: 1.2, dashArray: "4 5", fillOpacity: 0.06, interactive: false }).addTo(m);
        }
        const nueva = a.estado === "critica" && antes.current[a.apiario_id] !== "critica";
        const onda = nueva
          ? `<span class="onda" style="--retraso:${(turno[a.apiario_id] ?? 0) * 1.1}s"></span><span class="onda" style="--retraso:${(turno[a.apiario_id] ?? 0) * 1.1 + 0.7}s"></span>`
          : "";
        const html = `<div class="marcador ${claseEstado(a.estado)}">${onda}${hexSvg(a.estado)}<span>${escapar(a.nombre)}</span></div>`;
        const marca = L.marker([a.lat, a.lon], {
          icon: L.divIcon({ html, className: "", iconSize: null, iconAnchor: [15, 16] }),
          title: `${a.nombre}: ${ESTADOS[a.estado]?.palabra}`,
          keyboard: true,
        }).addTo(m);
        if (alTocar) marca.on("click", () => alTocar(a));
      }
      // línea entre los apiarios de un mismo brote
      for (const b of brotes) {
        const linea = b.map((id) => apiarios.find((a) => a.apiario_id === id)).filter(Boolean).map((a) => [a.lat, a.lon]);
        if (linea.length > 1) L.polyline(linea, { color: "#a63c29", weight: 2, dashArray: "4 4", interactive: false }).addTo(m);
      }
      antes.current = Object.fromEntries(apiarios.map((a) => [a.apiario_id, a.estado]));

      // encuadrar solo la primera vez, para no mover el mapa mientras la persona lo usa
      if (!encuadrado.current && puntos.length) {
        if (puntos.length === 1) m.setView(puntos[0], 12);
        else m.fitBounds(puntos, { padding: [40, 40], maxZoom: 12 });
        encuadrado.current = true;
      }
    });
    return () => { cancelado = true; };
  }, [apiarios, brotes, alTocar]);

  useEffect(() => () => { mapa.current?.remove(); mapa.current = null; }, []);

  return <div ref={div} className="mapa" style={{ height: alto }} role="region" aria-label="Mapa de apiarios" />;
}
