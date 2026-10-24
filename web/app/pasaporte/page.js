"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { post, useApi } from "@/lib/api";
import { FLORES } from "@/lib/textos";
import { Cargando, Chip, IconoEstado, claseEstado, fecha } from "@/components/ui";
import { BotonWhatsApp } from "@/components/Acciones";

export default function MiMiel() {
  const { datos, error, recargar } = useApi("/colmenas", 0);
  const { datos: lista, recargar: recargarLista } = useApi("/pasaportes", 0);
  const [apiario, setApiario] = useState("");
  const [kg, setKg] = useState(200);
  const [flor, setFlor] = useState(FLORES[0]);
  const [cosecha, setCosecha] = useState(new Date().toISOString().slice(0, 10));
  const [creado, setCreado] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const qr = useRef(null);

  if (!datos) return <Cargando error={error} recargar={recargar} />;
  const elegido = apiario;

  async function crear() {
    setOcupado(true);
    setFallo(null);
    try {
      setCreado(await post("/pasaportes", { apiario_id: elegido, kg: Number(kg), fecha_cosecha: cosecha, floracion: flor }));
      recargarLista();
      setTimeout(() => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setFallo(e.message);
    } finally {
      setOcupado(false);
    }
  }

  function descargarQR() {
    const lienzo = qr.current?.querySelector("canvas");
    if (!lienzo) return;
    const a = document.createElement("a");
    a.href = lienzo.toDataURL("image/png");
    a.download = `certificado-${creado.pasaporte_id}.png`;
    a.click();
  }

  const url = creado && typeof window !== "undefined" ? `${window.location.origin}/pasaporte/${creado.pasaporte_id}` : "";
  const apto = creado?.dictamen === "APTO";

  return (
    <>
      <h1>🍯 Certificado de mi miel</h1>
      <p className="sub">
        Demuestra al comprador de dónde viene tu miel y que tu apiario no fue fumigado. Así puedes pedir mejor precio.
      </p>

      <h2>1. ¿De qué apiario es la miel?</h2>
      <div className="opciones" role="radiogroup" aria-label="Apiario">
        {datos.apiarios.map((a) => (
          <button key={a.apiario_id} className="opcion" role="radio" aria-checked={elegido === a.apiario_id}
            onClick={() => setApiario(a.apiario_id)}>
            <span style={{ fontSize: "1.6rem" }} aria-hidden="true">{elegido === a.apiario_id ? "🔘" : "⚪"}</span>
            <span style={{ flex: 1 }}><b>{a.nombre}</b><small>{a.municipio} · {a.colmenas.length} colmenas</small></span>
            <Chip estado={a.estado} />
          </button>
        ))}
      </div>

      <h2>2. ¿Cuántos kilos?</h2>
      <div className="contador">
        <button onClick={() => setKg(Math.max(10, Number(kg) - 10))} aria-label="Quitar 10 kilos">−</button>
        <input type="number" inputMode="numeric" min="1" value={kg} onChange={(e) => setKg(e.target.value)} aria-label="Kilos de miel" />
        <button onClick={() => setKg(Number(kg) + 10)} aria-label="Agregar 10 kilos">+</button>
      </div>

      <h2>3. ¿De qué flor?</h2>
      <div className="fichas" role="group" aria-label="Flor">
        {FLORES.map((f) => <button key={f} className="ficha" aria-pressed={flor === f} onClick={() => setFlor(f)}>🌼 {f}</button>)}
      </div>

      <h2>4. ¿Cuándo la cosechaste?</h2>
      <input type="date" value={cosecha} onChange={(e) => setCosecha(e.target.value)} aria-label="Fecha de cosecha" />

      <button className="boton primario ancho" style={{ marginTop: 20 }} disabled={ocupado || !elegido} onClick={crear}>
        <span className="emoji" aria-hidden="true">✍️</span>{ocupado ? "Creando y firmando…" : elegido ? "Crear el certificado" : "Primero elige tu apiario"}
      </button>
      {fallo && <div className="error">{fallo}</div>}

      {creado && (
        <section id="resultado" style={{ marginTop: 20, scrollMarginTop: 80 }}>
          <div className={`dictamen ${claseEstado(apto ? "sana" : "critica")}`}>
            <div className="emoji" aria-hidden="true">{apto ? "🍯" : "⛔"}</div>
            <div className="grande">{apto ? "Miel apta" : "No apta"}</div>
            <p style={{ margin: "8px 0 0" }}>{creado.sobre.documento.motivos.join(" · ")}</p>
          </div>
          <div className="tarjeta" style={{ marginTop: 12, textAlign: "center" }}>
            <p style={{ marginTop: 0 }}><b>El comprador escanea este código</b> con la cámara de su teléfono:</p>
            <div className="qr" ref={qr}><QRCodeCanvas value={url} size={220} marginSize={2} /></div>
            <p className="chico">{creado.pasaporte_id}</p>
          </div>
          <div className="acciones">
            <BotonWhatsApp texto={`🍯 Certificado de mi miel (${creado.dictamen}) – KAB Centinela: ${url}`} etiqueta="Mandar al comprador" />
            <button className="boton" onClick={descargarQR}><span className="emoji" aria-hidden="true">⬇️</span>Guardar el código</button>
            <Link className="boton" href={`/pasaporte/${creado.pasaporte_id}`}><span className="emoji" aria-hidden="true">👀</span>Ver como el comprador</Link>
          </div>
        </section>
      )}

      {lista?.pasaportes?.length > 0 && (
        <>
          <h2>Certificados que ya hiciste</h2>
          <div className="pila">
            {lista.pasaportes.map((p) => (
              <Link key={p.doc_id} href={`/pasaporte/${p.doc_id}`} className="tarjeta" style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none" }}>
                <IconoEstado estado={p.dictamen === "APTO" ? "sana" : "critica"} tam={36} />
                <span style={{ flex: 1 }}><b>{p.dictamen === "APTO" ? "Miel apta" : "No apta"}</b> · {p.apiario_id}<div className="chico">{fecha(p.creado)}</div></span>
                <span aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
