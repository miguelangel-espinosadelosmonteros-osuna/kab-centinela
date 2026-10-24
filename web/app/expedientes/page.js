"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { problema } from "@/lib/textos";
import { Cargando, fecha, hace } from "@/components/ui";

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
      <div className="tarjeta" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: "2.2rem" }} aria-hidden="true">🛡️</span>
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
            <span className="emoji" aria-hidden="true">{problema(e.tipo_alerta).emoji}</span>
            <h3>{problema(e.tipo_alerta).titulo}</h3>
            <p>Colmena <b>{e.colmena_id}</b> · {e.apiario_id}</p>
            <p className="donde">{fecha(e.creado)} ({hace(e.creado)}) · 🔒 Protegida</p>
            <span className="boton ir">Abrir la prueba</span>
          </Link>
        ))}
      </div>
    </>
  );
}
