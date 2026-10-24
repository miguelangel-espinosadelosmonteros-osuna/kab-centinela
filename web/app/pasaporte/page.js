"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { post, useApi } from "@/lib/api";
import { Cargando, Insignia, hora } from "@/components/ui";

export default function CrearPasaporte() {
  const { datos, error } = useApi("/colmenas", 0);
  const { datos: lista, recargar } = useApi("/pasaportes", 0);
  const [form, setForm] = useState({ apiario_id: "", kg: 300, fecha_cosecha: new Date().toISOString().slice(0, 10), floracion: "Tajonal" });
  const [creado, setCreado] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  if (!datos) return <Cargando error={error} />;
  const apiarios = datos.apiarios;
  const apiario = form.apiario_id || apiarios[0]?.apiario_id || "";

  async function crear(ev) {
    ev.preventDefault();
    setOcupado(true);
    setFallo(null);
    try {
      setCreado(await post("/pasaportes", { ...form, apiario_id: apiario, kg: Number(form.kg) }));
      recargar();
    } catch (e) {
      setFallo(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const url = creado && typeof window !== "undefined" ? `${window.location.origin}/pasaporte/${creado.pasaporte_id}` : "";

  return (
    <>
      <h1>Pasaporte del lote de miel</h1>
      <p className="sub">
        Certifica de dónde viene la miel y si el apiario estuvo libre de intoxicaciones. Queda firmado con AWS KMS
        y el comprador lo verifica con el QR.
      </p>

      <form className="tarjeta formulario" onSubmit={crear}>
        <label>Apiario
          <select value={apiario} onChange={(e) => setForm({ ...form, apiario_id: e.target.value })}>
            {apiarios.map((a) => <option key={a.apiario_id} value={a.apiario_id}>{a.nombre} ({a.municipio})</option>)}
          </select>
        </label>
        <label>Kilos<input type="number" min="1" value={form.kg} onChange={(e) => setForm({ ...form, kg: e.target.value })} /></label>
        <label>Cosecha<input type="date" value={form.fecha_cosecha} onChange={(e) => setForm({ ...form, fecha_cosecha: e.target.value })} /></label>
        <label>Floración<input value={form.floracion} onChange={(e) => setForm({ ...form, floracion: e.target.value })} /></label>
        <button className="primario" disabled={ocupado || !apiario}>{ocupado ? "Firmando…" : "Generar pasaporte"}</button>
      </form>
      {fallo && <div className="error">{fallo}</div>}

      {creado && (
        <div className="tarjeta" style={{ marginTop: 12, textAlign: "center" }}>
          <div className={`dictamen ${creado.dictamen === "APTO" ? "si" : "no"}`}>{creado.dictamen}</div>
          <p>{creado.sobre.documento.motivos.join(" · ")}</p>
          <div className="qr"><QRCodeSVG value={url} size={180} /></div>
          <p><Link href={`/pasaporte/${creado.pasaporte_id}`}>{creado.pasaporte_id}</Link></p>
        </div>
      )}

      <h2>Pasaportes emitidos</h2>
      {!lista?.pasaportes?.length ? <p className="sub">Ninguno todavía.</p> : (
        <ul className="lista">
          {lista.pasaportes.map((p) => (
            <li key={p.doc_id} className="tarjeta">
              <div className="linea">
                <Insignia valor={p.dictamen === "APTO" ? "sana" : "critica"} texto={p.dictamen} />
                <Link href={`/pasaporte/${p.doc_id}`}><strong>{p.doc_id}</strong></Link>
              </div>
              <small>{hora(p.creado)} · {p.apiario_id}</small>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
