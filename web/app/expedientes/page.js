"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { problema } from "@/lib/textos";
import { Cargando, fecha, hace } from "@/components/ui";
import Icono from "@/components/Icono";

export default function Pruebas() {
  const { datos, error, recargar } = useApi("/expedientes", 8000);
  const [colmena, setColmena] = useState("");
  useEffect(() => {
    setColmena(new URLSearchParams(window.location.search).get("colmena") || "");
  }, []);
  if (!datos) return <Cargando error={error} recargar={recargar} />;

  const lista = datos.expedientes.filter((e) => !colmena || e.colmena_id === colmena);

  return (
    <>
      <h1>Pruebas para denunciar</h1>
      <div className="tarjeta" style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Icono nombre="escudo" tam={40} />
        <p style={{ margin: 0 }}>
          Cada vez que notamos un envenenamiento guardamos una <b>prueba que nadie puede borrar ni cambiar</b>.
          Llévala a PROFEPA o a tu cooperativa.
        </p>
      </div>
      {colmena && (
        <p style={{ marginTop: 12 }}>
          Mostrando solo la colmena <b>{colmena}</b>. <button className="ficha" onClick={() => setColmena("")}>Ver todas</button>
        </p>
      )}
      <h2>{lista.length ? `${lista.length} pruebas guardadas` : "Todavía no hay pruebas"}</h2>
      <div className="pila">
        {lista.map((e) => (
          <Link key={e.doc_id} href={`/expedientes/${e.doc_id}`} className="tarjeta aviso estado-critica" style={{ textDecoration: "none" }}>
            <span className="disco" aria-hidden="true"><Icono nombre={e.tipo_alerta} tam={30} grosor={1.9} /></span>
            <h3>{problema(e.tipo_alerta).titulo}</h3>
            <p>Colmena <b className="dato">{e.colmena_id}</b> · {e.apiario_id}</p>
            <p className="donde" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              {fecha(e.creado)} ({hace(e.creado)}) · <Icono nombre="candado" tam={16} grosor={2} />Protegida
            </p>
            <span className="boton ir">Abrir la prueba</span>
          </Link>
        ))}
      </div>
    </>
  );
}
