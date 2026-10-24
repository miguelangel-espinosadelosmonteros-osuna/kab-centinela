"use client";

import { useParams } from "next/navigation";
import { useApi } from "@/lib/api";
import { Cargando, hora } from "@/components/ui";

// Lo que ve el comprador al escanear el QR.
export default function VerPasaporte() {
  const { id } = useParams();
  const { datos, error } = useApi(`/pasaportes/${id}`, 0);
  if (!datos) return <Cargando error={error} />;

  const doc = datos.pasaporte.sobre.documento;
  const v = datos.verificacion;
  const o = doc.origen, l = doc.lote;

  return (
    <>
      <h1>Pasaporte {doc.pasaporte_id}</h1>
      <p className="sub">Miel de la Península de Yucatán · emitido {hora(doc.generado_en)}</p>

      <div className={`dictamen ${doc.apto ? "si" : "no"}`}>{doc.dictamen}</div>
      <div className={`veredicto ${v.valida ? "si" : "no"}`}>
        {v.valida ? "✔ Firma verificada con AWS KMS: " : "✘ "}{v.motivo}
      </div>

      <table className="datos-tabla tarjeta">
        <tbody>
          <tr><td>Apiario</td><td>{o.apiario_nombre || o.apiario_id}</td></tr>
          <tr><td>Municipio</td><td>{o.municipio}, {o.estado}</td></tr>
          {o.lat && <tr><td>Ubicación</td><td>{o.lat}, {o.lon}</td></tr>}
          {o.apicultor && <tr><td>Apicultor</td><td>{o.apicultor}</td></tr>}
          <tr><td>Lote</td><td>{l.kg} kg · cosecha {l.fecha_cosecha} · {l.floracion}</td></tr>
          {l.colmenas && <tr><td>Colmenas</td><td>{l.colmenas.join(", ")}</td></tr>}
          <tr><td>Sanidad</td><td>{doc.motivos.join(" · ")}</td></tr>
          <tr><td>Denominación de origen</td><td>{doc.denominacion_origen.elegible ? "Elegible" : "No elegible"} · {doc.denominacion_origen.nota}</td></tr>
        </tbody>
      </table>
    </>
  );
}
