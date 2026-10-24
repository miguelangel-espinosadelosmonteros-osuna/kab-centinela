"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, post, useApi } from "@/lib/api";
import { problema } from "@/lib/textos";
import { Cargando, IconoEstado, claseEstado, fecha, num } from "@/components/ui";
import { BotonEscuchar, BotonWhatsApp, urlActual } from "@/components/Acciones";

function Veredicto({ v }) {
  if (!v) return null;
  const ok = v.valida;
  return (
    <div className={`veredicto ${claseEstado(ok ? "sana" : "critica")}`} role="status">
      <IconoEstado estado={ok ? "sana" : "critica"} />
      <div>
        {ok ? "Es auténtica: nadie la ha cambiado desde que se guardó." : "¡Cuidado! Esta prueba fue cambiada: ya no vale."}
        <div className="chico" style={{ fontWeight: 400 }}>{v.motivo}</div>
      </div>
    </div>
  );
}

export default function Prueba() {
  const { id } = useParams();
  const { datos, error, recargar } = useApi(`/expedientes/${id}`, 0);
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [tecnico, setTecnico] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (datos) setTexto(JSON.stringify(datos.expediente.sobre.documento, null, 2));
  }, [datos]);

  if (!datos) return <Cargando error={error} recargar={recargar} />;
  const e = datos.expediente;
  const doc = e.sobre.documento;
  const p = problema(doc.alerta.tipo);
  const m = doc.alerta.metricas || {};

  async function correr(fn, guardar) {
    setOcupado(true);
    try { guardar((await fn()).verificacion); }
    catch (err) { guardar({ valida: false, motivo: err.message }); }
    finally { setOcupado(false); }
  }

  function alterar() {
    const d = JSON.parse(texto);
    if (d.alerta?.metricas?.caida_sonido_db !== undefined) d.alerta.metricas.caida_sonido_db = 1.0;
    else d.generado_en = "2020-01-01T00:00:00Z";
    setTexto(JSON.stringify(d, null, 2));
    setTecnico(null);
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(e.narrativa); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch {}
  }

  return (
    <>
      <Link href="/expedientes" className="volver">← Todas las pruebas</Link>
      <h1>{p.emoji} Prueba de {p.titulo.toLowerCase()}</h1>
      <p className="sub">Colmena {doc.ubicacion.colmena_id} · {doc.ubicacion.apiario_nombre}, {doc.ubicacion.municipio}</p>

      <button className="boton primario ancho" disabled={ocupado}
        onClick={() => correr(() => api(`/expedientes/${id}/verificar`), setResultado)}>
        <span className="emoji" aria-hidden="true">🔍</span>{ocupado ? "Comprobando…" : "Comprobar que es auténtica"}
      </button>
      <div style={{ marginTop: 12 }}><Veredicto v={resultado} /></div>

      <h2>Qué pasó</h2>
      <div className="tarjeta">
        <table className="tabla">
          <tbody>
            <tr><th>Cuándo</th><td>{fecha(doc.alerta.detectada_en)}</td></tr>
            <tr><th>Dónde</th><td>{doc.ubicacion.apiario_nombre}, {doc.ubicacion.municipio}, Yucatán</td></tr>
            {m.caida_sonido_db !== undefined && <tr><th>Zumbido</th><td>Bajó {num(m.caida_sonido_db, 1)} dB (de {num(m.sonido_base_db, 0)} a {num(m.sonido_actual_db, 0)})</td></tr>}
            {m.caida_peso_kg !== undefined && <tr><th>Peso</th><td>Perdió {num(m.caida_peso_kg, 2)} kg</td></tr>}
            {m.apiarios && <tr><th>Apiarios afectados</th><td>{m.apiarios.join(", ")} (a {num(m.distancia_max_km, 1)} km o menos)</td></tr>}
            <tr><th>Lecturas guardadas</th><td>{doc.lecturas_sensor?.length || 0} del sensor</td></tr>
            <tr><th>Protegida</th><td>🔒 Nadie la puede borrar ni cambiar hasta {fecha(e.s3?.retencion_hasta)}</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Texto para la denuncia</h2>
      <div className="tarjeta">
        <div className="narrativa">{e.narrativa}</div>
        <p className="chico" style={{ marginTop: 10 }}>Redactado con inteligencia artificial a partir de los datos guardados. La prueba son los datos, no este texto.</p>
      </div>
      <div className="acciones">
        <BotonEscuchar texto={e.narrativa} etiqueta="Escuchar el texto" />
        <button className="boton" onClick={copiar}><span className="emoji" aria-hidden="true">📋</span>{copiado ? "¡Copiado!" : "Copiar el texto"}</button>
        <BotonWhatsApp texto={`🛡️ Prueba de ${p.titulo.toLowerCase()} – KAB Centinela: ${urlActual()}`} etiqueta="Mandar por WhatsApp" />
        <button className="boton" onClick={() => window.print()}><span className="emoji" aria-hidden="true">🖨️</span>Imprimir o guardar PDF</button>
      </div>

      <details className="tarjeta" style={{ marginTop: 20 }}>
        <summary>Para técnicos y jueces: cómo se protege</summary>
        <table className="tabla">
          <tbody>
            <tr><th>Guardado en</th><td style={{ wordBreak: "break-all" }}>Amazon S3 con Object Lock ({e.s3?.retencion_modo}): s3://{e.s3?.bucket}/{e.s3?.key}</td></tr>
            <tr><th>Versión</th><td style={{ wordBreak: "break-all" }}>{e.s3?.version_id}</td></tr>
            <tr><th>Firma</th><td>{e.sobre.firma.algoritmo} con AWS KMS (llave P-256 que nunca sale de AWS)</td></tr>
            <tr><th>Huella SHA-256</th><td style={{ wordBreak: "break-all" }}>{e.sobre.firma.digest_sha256}</td></tr>
            <tr><th>Narrativa</th><td>{e.narrativa_fuente}</td></tr>
          </tbody>
        </table>
        <h3 style={{ marginTop: 14 }}>Prueba: cambia un dato y verás que la firma falla</h3>
        <div className="acciones">
          <button className="boton" onClick={alterar}>✏️ Alterar un dato</button>
          <button className="boton primario" disabled={ocupado}
            onClick={() => correr(() => post("/verificar", { sobre: { documento: JSON.parse(texto), firma: e.sobre.firma } }), setTecnico)}>
            Comprobar este documento
          </button>
        </div>
        <div style={{ margin: "12px 0" }}><Veredicto v={tecnico} /></div>
        <label className="campo">Documento firmado (JSON)
          <textarea value={texto} onChange={(ev) => { setTexto(ev.target.value); setTecnico(null); }} />
        </label>
      </details>
    </>
  );
}
