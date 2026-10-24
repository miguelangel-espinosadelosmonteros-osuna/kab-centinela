"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, post, useApi } from "@/lib/api";
import { Cargando, hora } from "@/components/ui";

export default function Expediente() {
  const { id } = useParams();
  const { datos, error } = useApi(`/expedientes/${id}`, 0);
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (datos) setTexto(JSON.stringify(datos.expediente.sobre.documento, null, 2));
  }, [datos]);

  if (!datos) return <Cargando error={error} />;
  const e = datos.expediente;

  async function correr(fn) {
    setOcupado(true);
    try {
      setResultado(await fn());
    } catch (err) {
      setResultado({ verificacion: { valida: false, motivo: err.message } });
    } finally {
      setOcupado(false);
    }
  }

  function alterar() {
    const doc = JSON.parse(texto);
    if (doc.alerta?.metricas?.caida_sonido_db !== undefined) doc.alerta.metricas.caida_sonido_db = 1.0;
    else doc.generado_en = "2020-01-01T00:00:00Z";
    setTexto(JSON.stringify(doc, null, 2));
    setResultado(null);
  }

  function verificarTexto() {
    return correr(() => post("/verificar", { sobre: { documento: JSON.parse(texto), firma: e.sobre.firma } }));
  }

  const v = resultado?.verificacion;

  return (
    <>
      <p className="sub"><Link href="/expedientes">← Expedientes</Link></p>
      <h1>{e.doc_id}</h1>
      <p className="sub">Generado {hora(e.creado)} · narrativa: {e.narrativa_fuente}</p>

      <div className="tarjeta">
        <h2 style={{ marginTop: 0 }}>Expediente (redactado por Amazon Bedrock)</h2>
        <div className="narrativa">{e.narrativa}</div>
        <p className="fuente">La narrativa explica el JSON firmado; la evidencia es el JSON.</p>
      </div>

      <h2>Dónde está guardado</h2>
      <table className="datos-tabla tarjeta">
        <tbody>
          <tr><td>S3</td><td>s3://{e.s3.bucket}/{e.s3.key}</td></tr>
          <tr><td>Versión</td><td>{e.s3.version_id}</td></tr>
          <tr><td>Object Lock</td><td>{e.s3.retencion_modo}: no se puede borrar ni cambiar hasta {hora(e.s3.retencion_hasta)}</td></tr>
          <tr><td>Firma</td><td>{e.sobre.firma.algoritmo} con AWS KMS</td></tr>
          <tr><td>SHA-256</td><td style={{ wordBreak: "break-all" }}>{e.sobre.firma.digest_sha256}</td></tr>
        </tbody>
      </table>

      <h2>Verificar la firma</h2>
      <div className="acciones">
        <button className="primario" disabled={ocupado}
          onClick={() => correr(() => api(`/expedientes/${id}/verificar`))}>Verificar copia en S3</button>
        <button disabled={ocupado} onClick={verificarTexto}>Verificar el JSON de abajo</button>
        <button disabled={ocupado} onClick={alterar}>Alterar un dato</button>
      </div>
      {v && (
        <div className={`veredicto ${v.valida ? "si" : "no"}`}>
          {v.valida ? "✔ " : "✘ "}{v.motivo}
          {v.fuente && <div className="fuente">{v.fuente}</div>}
        </div>
      )}
      <label>
        Documento firmado (puedes editarlo para probar)
        <textarea value={texto} onChange={(ev) => { setTexto(ev.target.value); setResultado(null); }} />
      </label>
    </>
  );
}
