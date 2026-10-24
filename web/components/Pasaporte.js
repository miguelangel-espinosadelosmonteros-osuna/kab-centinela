"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { QRCodeCanvas } from "qrcode.react";
import Icono from "@/components/Icono";
import { IconoEstado, num } from "@/components/ui";

const CURVA_MIEL = [0.22, 1, 0.36, 1];

/**
 * Pasaporte del lote: al frente origen y dictamen, atrás el QR que escanea el comprador.
 * Se voltea con un botón visible; con "reducir movimiento" cambia de cara solo con opacidad.
 * `qrRef` sirve para descargar el código como imagen.
 */
export default function Pasaporte({ documento: doc, url, qrRef, conQr = true }) {
  const [atras, setAtras] = useState(false);
  const reducido = useReducedMotion();
  const o = doc.origen, l = doc.lote;

  const frente = (oculta, extra) => (
    <div className="cara frente" aria-hidden={oculta} {...extra}>
      <span className="ceja">Pasaporte del lote · KAB Centinela</span>
      <h2>{num(l.kg, 0)} kg de miel de {l.floracion}</h2>
      <dl>
        <dt>Apiario</dt><dd>{o.apiario_nombre || o.apiario_id}</dd>
        <dt>Lugar</dt><dd>{o.municipio}, {o.estado}</dd>
        {o.apicultor && <><dt>Apicultor</dt><dd>{o.apicultor}</dd></>}
        <dt>Cosecha</dt><dd>{l.fecha_cosecha}</dd>
        {l.colmenas && <><dt>Colmenas</dt><dd className="dato">{l.colmenas.join(", ")}</dd></>}
      </dl>
      <div className={`dictamen-sello ${doc.apto ? "apto" : "no-apto"}`}>
        <IconoEstado estado={doc.apto ? "sana" : "critica"} titulo="" tam={40} />
        <span><b>{doc.apto ? "Miel apta" : "No apta"}</b><small>{doc.motivos?.join(" · ")}</small></span>
      </div>
    </div>
  );
  const vuelta = (oculta, extra) => (
    <div className="cara vuelta" aria-hidden={oculta} {...extra}>
      <span className="ceja">El comprador escanea este código</span>
      <div className="qr" ref={qrRef}><QRCodeCanvas value={url} size={200} marginSize={1} fgColor="#3a2414" /></div>
      <span className="dato chico">{doc.pasaporte_id}</span>
      <p className="chico" style={{ margin: 0 }}>Firmado con AWS KMS: si alguien cambia un dato, la firma deja de valer.</p>
    </div>
  );

  return (
    <div className="pasaporte-zona">
      <div className="pasaporte">
        {reducido ? (
          // sin giro: las dos caras encimadas y cambia la opacidad
          <div className="hoja plano">
            {frente(atras, { style: { opacity: atras ? 0 : 1, visibility: atras ? "hidden" : "visible" } })}
            {vuelta(!atras, { style: { opacity: atras ? 1 : 0, visibility: atras ? "visible" : "hidden" } })}
          </div>
        ) : (
          <m.div className="hoja" initial={false} animate={{ rotateY: atras ? 180 : 0 }} transition={{ duration: 0.6, ease: CURVA_MIEL }}>
            {frente(atras)}{vuelta(!atras)}
          </m.div>
        )}
      </div>
      {conQr && (
        <button className="boton" type="button" onClick={() => setAtras(!atras)} aria-pressed={atras}>
          <Icono nombre={atras ? "frasco" : "qr"} />{atras ? "Ver los datos" : "Ver código QR"}
        </button>
      )}
    </div>
  );
}
