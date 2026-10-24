"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { claseEstado } from "@/components/ui";
import { ESTADOS } from "@/lib/textos";

// Mismas formas que IconoEstado, como texto para el marcador de Leaflet
const SVG = {
  sana: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0ca30c"/><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  critica: '<svg viewBox="0 0 24 24"><path d="M8 1h8l7 7v8l-7 7H8l-7-7V8z" fill="#d03b3b"/><path d="M12 6v7.5" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.7" fill="#fff"/></svg>',
  alerta: '<svg viewBox="0 0 24 24"><path d="M12 1.5L23 21.5H1z" fill="#ec835a"/><path d="M12 8.5v6" stroke="#1b1813" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18" r="1.5" fill="#1b1813"/></svg>',
  atencion: '<svg viewBox="0 0 24 24"><path d="M12 1.5L23 21.5H1z" fill="#fab219"/><path d="M12 8.5v6" stroke="#1b1813" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18" r="1.5" fill="#1b1813"/></svg>',
};

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Mapa de apiarios con OpenStreetMap. Cada apiario lleva ícono + nombre.
 * Alrededor de un apiario en estado crítico dibuja el radio de 3 km donde se buscan brotes.
 */
export default function Mapa({ apiarios, alTocar, alto = 280 }) {
  const div = useRef(null);
  const mapa = useRef(null);
  const encuadrado = useRef(false);

  useEffect(() => {
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !div.current) return;
      if (!mapa.current) {
        mapa.current = L.map(div.current, { scrollWheelZoom: false, attributionControl: true });
        // De lejos solo íconos (los nombres se enciman); al acercar aparecen los nombres
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
      const puntos = [];
      for (const a of apiarios) {
        if (a.lat == null || a.lon == null) continue;
        puntos.push([a.lat, a.lon]);
        if (a.estado === "critica") {
          L.circle([a.lat, a.lon], { radius: 3000, color: "#d03b3b", weight: 1, fillOpacity: 0.08 }).addTo(m);
        }
        const html = `<div class="marcador ${claseEstado(a.estado)}">${SVG[a.estado] || SVG.sana}<span>${escapar(a.nombre)}</span></div>`;
        const marca = L.marker([a.lat, a.lon], {
          icon: L.divIcon({ html, className: "", iconSize: null, iconAnchor: [14, 14] }),
          title: `${a.nombre}: ${ESTADOS[a.estado]?.palabra}`,
          keyboard: true,
        }).addTo(m);
        if (alTocar) marca.on("click", () => alTocar(a));
      }
      // encuadrar solo la primera vez, para no mover el mapa mientras la persona lo usa
      if (!encuadrado.current && puntos.length) {
        if (puntos.length === 1) m.setView(puntos[0], 12);
        else m.fitBounds(puntos, { padding: [40, 40], maxZoom: 12 });
        encuadrado.current = true;
      }
    });
    return () => { cancelado = true; };
  }, [apiarios, alTocar]);

  useEffect(() => () => { mapa.current?.remove(); mapa.current = null; }, []);

  return <div ref={div} className="mapa" style={{ height: alto }} role="region" aria-label="Mapa de apiarios" />;
}
