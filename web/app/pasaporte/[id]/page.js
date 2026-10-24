"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/api";
import { Cargando, IconoEstado, claseEstado, fecha, num } from "@/components/ui";

const Mapa = dynamic(() => import("@/components/Mapa"), { ssr: false, loading: () => <div className="mapa" style={{ height: 200 }} /> });

// Lo que ve el comprador al escanear el QR.
export default function Certificado() {
  const { id } = useParams();
  const { datos, error, recargar } = useApi(`/pasaportes/${id}`, 0);
  if (!datos) return <Cargando error={error} recargar={recargar} />;

  const doc = datos.pasaporte.sobre.documento;
  const v = datos.verificacion;
  const o = doc.origen, l = doc.lote;

  return (
    <>
      <p className="sub" style={{ marginTop: 8 }}>Certificado de miel · KAB Centinela</p>
      <div className={`dictamen ${claseEstado(doc.apto ? "sana" : "critica")}`}>
        <div className="emoji" aria-hidden="true">{doc.apto ? "🍯" : "⛔"}</div>
        <div className="grande">{doc.apto ? "Miel apta" : "Miel no apta"}</div>
        <p style={{ margin: "8px 0 0" }}>
          {doc.apto ? "El apiario no tuvo envenenamientos en los últimos 60 días." : doc.motivos.join(" · ")}
        </p>
      </div>

      <div className={`veredicto ${claseEstado(v.valida ? "sana" : "critica")}`} style={{ marginTop: 12 }}>
        <IconoEstado estado={v.valida ? "sana" : "critica"} />
        <div>
          {v.valida ? "Certificado auténtico" : "Certificado NO válido"}
          <div className="chico" style={{ fontWeight: 400 }}>
            {v.valida ? "Firmado digitalmente con AWS KMS: nadie lo ha cambiado." : v.motivo}
          </div>
        </div>
      </div>

      <h2>De dónde viene</h2>
      <div className="tarjeta">
        <table className="tabla">
          <tbody>
            <tr><th>Apiario</th><td>{o.apiario_nombre || o.apiario_id}</td></tr>
            <tr><th>Lugar</th><td>{o.municipio}, {o.estado} · {o.region}</td></tr>
            {o.apicultor && <tr><th>Apicultor</th><td>{o.apicultor}</td></tr>}
            <tr><th>Lote</th><td>{num(l.kg, 0)} kg de miel de {l.floracion}</td></tr>
            <tr><th>Cosecha</th><td>{l.fecha_cosecha}</td></tr>
            {l.colmenas && <tr><th>Colmenas</th><td>{l.colmenas.join(", ")}</td></tr>}
            <tr><th>Emitido</th><td>{fecha(doc.generado_en)}</td></tr>
          </tbody>
        </table>
      </div>
      {o.lat != null && (
        <div style={{ marginTop: 12 }}>
          <Mapa alto={200} apiarios={[{ apiario_id: o.apiario_id, nombre: o.apiario_nombre || o.apiario_id, lat: o.lat, lon: o.lon, estado: doc.apto ? "sana" : "critica" }]} />
        </div>
      )}
      <p className="chico" style={{ marginTop: 12 }}>{doc.denominacion_origen?.nota}</p>
    </>
  );
}
