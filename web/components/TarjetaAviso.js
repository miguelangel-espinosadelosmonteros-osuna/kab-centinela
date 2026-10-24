"use client";

import Link from "next/link";
import Icono from "@/components/Icono";
import { problema } from "@/lib/textos";
import { Chip, claseEstado, estadoDeSeveridad, hace } from "@/components/ui";

/** Un aviso en palabras sencillas, con un solo botón grande: "¿Qué hago?". */
export default function TarjetaAviso({ alerta }) {
  const p = problema(alerta.tipo);
  const estado = estadoDeSeveridad(alerta.severidad);
  return (
    <article className={`tarjeta aviso ${claseEstado(estado)}`}>
      <span className="disco" aria-hidden="true"><Icono nombre={alerta.tipo} tam={30} grosor={1.9} /></span>
      <div>
        <Chip estado={estado} />
        <h3>{p.titulo}</h3>
      </div>
      <p>{p.corto}</p>
      <p className="donde">
        Colmena <b className="dato">{alerta.colmena_id}</b> · {alerta.apiario_nombre || alerta.apiario_id}
        {alerta.municipio ? `, ${alerta.municipio}` : ""} · {hace(alerta.recibido || alerta.ts)}
      </p>
      <Link className="boton primario ir" href={`/colmenas/${alerta.colmena_id}`}>¿Qué hago?</Link>
    </article>
  );
}
