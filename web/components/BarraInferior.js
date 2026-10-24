"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApi } from "@/lib/api";
import Icono from "@/components/Icono";

const LINKS = [
  ["/", "Inicio", "colmena"],
  ["/expedientes", "Pruebas", "escudo"],
  ["/pasaporte", "Mi miel", "frasco"],
];

export default function BarraInferior() {
  const ruta = usePathname();
  const { datos } = useApi("/colmenas", 15000);
  const urgentes = datos ? datos.resumen.critica + datos.resumen.alerta : 0;

  return (
    <footer className="barra-inferior">
      <nav aria-label="Secciones">
        {LINKS.map(([href, texto, icono]) => {
          const activo = href === "/" ? ruta === "/" || ruta.startsWith("/colmenas") || ruta.startsWith("/avisos") : ruta.startsWith(href);
          return (
            <Link key={href} href={href} className={activo ? "activo" : ""} aria-current={activo ? "page" : undefined}>
              <Icono nombre={icono} tam={28} />
              {texto}
              {href === "/" && urgentes > 0 && <span className="globo" aria-label={`${urgentes} urgentes`}>{urgentes}</span>}
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
