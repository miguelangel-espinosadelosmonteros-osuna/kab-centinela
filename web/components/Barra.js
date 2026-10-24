"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODO_DEMO } from "@/lib/api";

const LINKS = [
  ["/", "Tablero"],
  ["/expedientes", "Expedientes"],
  ["/pasaporte", "Pasaporte"],
  ["/problema", "El problema"],
];

export default function Barra() {
  const ruta = usePathname();
  return (
    <header className="barra">
      {MODO_DEMO && (
        <div className="aviso-demo">Modo demostración: falta NEXT_PUBLIC_API_URL, los datos no son reales.</div>
      )}
      <div className="contenedor">
        <Link href="/" className="marca">🐝 KAB <span>Centinela</span></Link>
        <nav>
          {LINKS.map(([href, texto]) => (
            <Link key={href} href={href}
              className={(href === "/" ? ruta === "/" : ruta.startsWith(href)) ? "activo" : ""}>
              {texto}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
