"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApi } from "@/lib/api";

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

const ICONOS = {
  inicio: <svg viewBox="0 0 24 24" aria-hidden="true"><path {...trazo} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  avisos: <svg viewBox="0 0 24 24" aria-hidden="true"><path {...trazo} d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" /></svg>,
  pruebas: <svg viewBox="0 0 24 24" aria-hidden="true"><path {...trazo} d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /><path {...trazo} d="M8.5 12l2.5 2.5 4.5-5" /></svg>,
  miel: <svg viewBox="0 0 24 24" aria-hidden="true"><path {...trazo} d="M8 3h8M7 6h10l1 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z" /><path {...trazo} d="M9 13c1.5 1 4.5 1 6 0" /></svg>,
};

const LINKS = [
  ["/", "Inicio", "inicio"],
  ["/avisos", "Avisos", "avisos"],
  ["/expedientes", "Pruebas", "pruebas"],
  ["/pasaporte", "Mi miel", "miel"],
];

export default function BarraInferior() {
  const ruta = usePathname();
  const { datos } = useApi("/colmenas", 15000);
  const urgentes = datos ? datos.resumen.critica + datos.resumen.alerta : 0;

  return (
    <footer className="barra-inferior">
      <nav aria-label="Secciones">
        {LINKS.map(([href, texto, icono]) => {
          const activo = href === "/" ? ruta === "/" || ruta.startsWith("/colmenas") : ruta.startsWith(href);
          return (
            <Link key={href} href={href} className={activo ? "activo" : ""} aria-current={activo ? "page" : undefined}>
              {ICONOS[icono]}
              {texto}
              {icono === "avisos" && urgentes > 0 && <span className="globo" aria-label={`${urgentes} urgentes`}>{urgentes}</span>}
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
