"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";
import { Cargando } from "@/components/ui";
import TarjetaAviso from "@/components/TarjetaAviso";

const FILTROS = [
  ["urgentes", "🔴 Urgentes y de hoy"],
  ["todos", "Todos"],
];

export default function Avisos() {
  const { datos, error, recargar } = useApi("/alertas?limite=60", 5000);
  const [filtro, setFiltro] = useState("urgentes");
  if (!datos) return <Cargando error={error} recargar={recargar} />;

  const lista = datos.alertas.filter((a) => filtro === "todos" || ["critica", "alta"].includes(a.severidad));

  return (
    <>
      <h1>Avisos</h1>
      <p className="sub">Lo que han notado tus colmenas. Los más nuevos van primero.</p>
      <div className="fichas" role="group" aria-label="Qué avisos ver" style={{ marginBottom: 14 }}>
        {FILTROS.map(([valor, texto]) => (
          <button key={valor} className="ficha" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>{texto}</button>
        ))}
      </div>
      {lista.length === 0 ? (
        <div className="tarjeta">✅ No hay avisos {filtro === "urgentes" ? "urgentes" : ""}. Tus colmenas están bien.</div>
      ) : (
        <div className="pila">{lista.map((a) => <TarjetaAviso key={a.alerta_id} alerta={a} />)}</div>
      )}
    </>
  );
}
