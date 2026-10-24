"use client";

import Link from "next/link";
import Icono from "@/components/Icono";
import { claseEstado } from "@/components/ui";
import { ESTADOS, problema } from "@/lib/textos";

const HEX = "50,2 96,27 96,79 50,104 4,79 4,27";

/**
 * Panal real: filas de 3 y 2 encajadas. Cada celda respira al ritmo de su estado
 * (calma si está sana, agitada si hay aviso); si el sensor cae, se apaga a gris cera.
 */
export default function Panal({ colmenas }) {
  const filas = [];
  for (let i = 0, n = 3; i < colmenas.length; i += n, n = n === 3 ? 2 : 3) filas.push(colmenas.slice(i, i + n));
  return (
    <div className="panal">
      {filas.map((fila, f) => (
        <div key={f} className={`fila${f % 2 ? " corrida" : ""}`}>
          {fila.map((c) => {
            const estado = c.conectada === false ? "apagada" : c.estado;
            const tipo = c.alertas_vigentes?.[0]?.tipo;
            const palabra = ESTADOS[estado]?.palabra;
            return (
              <Link key={c.colmena_id} href={`/colmenas/${c.colmena_id}`}
                className={`celda-colmena ${claseEstado(estado)}${estado === "apagada" ? "" : " respira"}`}
                aria-label={`Colmena ${c.colmena_id}: ${palabra}${tipo ? `, ${problema(tipo).titulo}` : ""}`}>
                <svg className="fondo" viewBox="0 0 100 106" preserveAspectRatio="none" aria-hidden="true"><polygon points={HEX} /></svg>
                <span className="contenido" aria-hidden="true">
                  <span className="glifo"><Icono nombre={estado === "apagada" ? "DESCONEXION" : tipo || "check"} tam={26} grosor={2} /></span>
                  <span className="id">{c.colmena_id}</span>
                  <span className="palabra">{palabra}</span>
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
