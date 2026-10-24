"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { CeldaMiel, Cargando, IconoEstado, claseEstado, fecha } from "@/components/ui";
import Pasaporte from "@/components/Pasaporte";

const Mapa = dynamic(() => import("@/components/Mapa"), { ssr: false, loading: () => <div className="mapa" style={{ height: 200 }} /> });

// Lo que ve el comprador al escanear el QR.
export default function Certificado() {
  const { id } = useParams();
  const { datos, error, recargar } = useApi(`/pasaportes/${id}`, 0);
  const [mostrar, setMostrar] = useState(false); // la celda se llena después de cargar
  useEffect(() => { if (datos) { const t = setTimeout(() => setMostrar(true), 150); return () => clearTimeout(t); } }, [datos]);
  if (!datos) return <Cargando error={error} recargar={recargar} />;

  const doc = datos.pasaporte.sobre.documento;
  const v = datos.verificacion;
  const o = doc.origen;
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <p className="ceja" style={{ marginTop: 12 }}>Certificado de miel · KAB Centinela</p>
      <h1>{doc.apto ? "Miel apta" : "Miel no apta"}</h1>
      <p className="sub">
        {doc.apto ? "El apiario no tuvo envenenamientos en los últimos 60 días." : doc.motivos.join(" · ")}
      </p>

      {v.valida ? (
        <div className="verificar" role="status">
          <CeldaMiel lleno={mostrar} check={mostrar} />
          <div>
            <b>Certificado auténtico</b>
            <span className="chico">Firmado digitalmente con AWS KMS: nadie lo ha cambiado.</span>
          </div>
        </div>
      ) : (
        <div className={`veredicto ${claseEstado("critica")}`} role="status">
          <IconoEstado estado="critica" titulo="" />
          <div>Certificado NO válido<div className="chico" style={{ fontWeight: 400 }}>{v.motivo}</div></div>
        </div>
      )}

      <h2>De dónde viene</h2>
      <Pasaporte documento={doc} url={url} conQr={false} />
      <p className="chico" style={{ textAlign: "center" }}>Emitido {fecha(doc.generado_en)}</p>
      {o.lat != null && (
        <div style={{ marginTop: 12 }}>
          <Mapa alto={200} apiarios={[{ apiario_id: o.apiario_id, nombre: o.apiario_nombre || o.apiario_id, lat: o.lat, lon: o.lon, estado: doc.apto ? "sana" : "critica" }]} />
        </div>
      )}
      <p className="chico" style={{ marginTop: 12 }}>{doc.denominacion_origen?.nota}</p>
    </>
  );
}
