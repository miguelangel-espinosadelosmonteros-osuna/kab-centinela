"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { Cargando, Insignia, hora } from "@/components/ui";

export default function Expedientes() {
  const { datos, error } = useApi("/expedientes", 6000);
  if (!datos) return <Cargando error={error} />;

  return (
    <>
      <h1>Expedientes firmados</h1>
      <p className="sub">
        Cada intoxicación genera un expediente: firmado con AWS KMS, redactado por Amazon Bedrock y guardado en S3
        con Object Lock (nadie lo puede borrar ni cambiar).
      </p>
      {!datos.expedientes.length ? <div className="tarjeta">Todavía no hay expedientes.</div> : (
        <ul className="lista">
          {datos.expedientes.map((e) => (
            <li key={e.doc_id} className="tarjeta">
              <div className="linea">
                <Insignia valor="critica" texto={e.tipo_alerta} />
                <Link href={`/expedientes/${e.doc_id}`}><strong>{e.doc_id}</strong></Link>
              </div>
              <small>{hora(e.creado)} · {e.colmena_id} · {e.apiario_id} · bloqueado ({e.retencion_modo}) hasta {hora(e.retencion_hasta)}</small>
              <div>{e.resumen}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
