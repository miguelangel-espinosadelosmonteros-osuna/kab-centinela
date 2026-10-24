"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/api";
import { ESTADOS, problema } from "@/lib/textos";
import { indicadores, tono } from "@/lib/indicadores";
import { Cargando, Chip, IconoEstado, claseEstado, estadoDeSeveridad, fecha, hace, num } from "@/components/ui";
import { BotonEscuchar, BotonLlamar, BotonWhatsApp, urlActual } from "@/components/Acciones";
import Grafica from "@/components/Grafica";
import Icono from "@/components/Icono";
import Zumbido from "@/components/Zumbido";

function Problema({ vigente, colmena, alerta }) {
  const p = problema(vigente.tipo);
  const estado = estadoDeSeveridad(vigente.severidad);
  const lugar = `${colmena.apiario_nombre || colmena.apiario_id}${colmena.municipio ? `, ${colmena.municipio}` : ""}`;
  const leer = `${p.titulo}. Colmena ${colmena.colmena_id}, ${lugar}. ${p.explicacion} Qué hacer: ${p.pasos
    .map((paso, i) => `${i + 1}. ${paso}`).join(" ")}`;
  const whatsapp = `KAB Centinela: ${p.titulo} en la colmena ${colmena.colmena_id} (${lugar}). ${p.corto} ${urlActual()}`;

  return (
    <section className={`tarjeta ${claseEstado(estado)}`} style={{ borderLeft: "6px solid var(--c)", borderRadius: "0 var(--radio) var(--radio) 0" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <span className="disco" aria-hidden="true"><Icono nombre={vigente.tipo} tam={30} grosor={1.9} /></span>
        <div>
          <Chip estado={estado} />
          <h2 style={{ margin: "6px 0 0" }}>{p.titulo}</h2>
        </div>
      </div>
      <p style={{ fontSize: "1.05rem" }}><b>¿Qué está pasando?</b> {p.explicacion}</p>
      {alerta && <p className="chico">Lo notamos {hace(alerta.recibido || alerta.ts)} · {alerta.mensaje}</p>}
      <h3 style={{ marginTop: 14 }}>Qué hacer ahora</h3>
      <ol className="pasos">{p.pasos.map((paso) => <li key={paso}>{paso}</li>)}</ol>
      <div className="acciones">
        <BotonEscuchar texto={leer} etiqueta="Escuchar qué hacer" />
        <BotonWhatsApp texto={whatsapp} etiqueta="Avisar por WhatsApp" />
        <BotonLlamar />
        {p.prueba && (
          <Link className="boton primario" href={`/expedientes?colmena=${colmena.colmena_id}`}>
            <Icono nombre="escudo" />Ver la prueba para denunciar
          </Link>
        )}
      </div>
    </section>
  );
}

export default function Colmena() {
  const { id } = useParams();
  const { datos, error, recargar } = useApi(`/colmenas/${id}?limite=96`, 5000);
  if (!datos) return <Cargando error={error} recargar={recargar} />;

  const { colmena: c, lecturas, alertas } = datos;
  const lista = indicadores(lecturas);
  const ultima = lecturas.at(-1) || c.ultima_lectura || {};
  const visible = c.conectada === false ? "apagada" : c.estado;
  const est = ESTADOS[visible] || ESTADOS.sana;

  return (
    <>
      <Link href="/" className="volver">← Volver al inicio</Link>
      <h1>Colmena {c.colmena_id}</h1>
      <p className="sub">{c.apiario_nombre} · {c.municipio}{c.apicultor ? ` · ${c.apicultor}` : ""}</p>

      <div className={`banner ${claseEstado(visible)}`} role="status">
        <IconoEstado estado={visible} titulo="" />
        <div><strong>{est.palabra}</strong><span>{c.alertas_vigentes?.length ? est.frase : "Todo normal en esta colmena."}</span></div>
      </div>
      {c.conectada === false && (
        <div className="tarjeta" style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <Icono nombre="DESCONEXION" tam={32} />
          <span><b>El sensor no responde.</b> Los datos de abajo son de la última vez que se comunicó.</span>
        </div>
      )}

      {c.alertas_vigentes?.length > 0 && (
        <div className="pila" style={{ marginTop: 16 }}>
          {c.alertas_vigentes.map((v) => (
            <Problema key={v.tipo} vigente={v} colmena={c} alerta={alertas.find((a) => a.alerta_id === v.alerta_id)} />
          ))}
        </div>
      )}

      <h2>¿Cómo está por dentro?</h2>
      <p className="sub">Toca una gráfica con el dedo para ver cada lectura.</p>
      <div className="pila">
        {lista.map((ind) => (
          <section key={ind.clave} className="tarjeta indicador">
            <div className="cabeza">
              <span className="etiqueta"><Icono nombre={ind.icono} />{ind.etiqueta}</span>
              <Chip estado={ind.estado} texto={ind.palabra} />
            </div>
            <div className="valor">{num(ind.valor, ind.dec)} <small>{ind.unidad}</small></div>
            {ind.clave === "zumbido" && <Zumbido db={ind.valor} hz={ultima.sonido_hz} base={(ind.banda[0] + ind.banda[1]) / 2} />}
            <Grafica datos={ind.serie} banda={ind.banda} unidad={ind.unidad} dec={ind.dec} nombre={ind.etiqueta}
              umbral={ind.clave === "zumbido" ? { v: (ind.banda[0] + ind.banda[1]) / 2 - 10, texto: "−10 dB: envenenamiento" } : undefined} />
          </section>
        ))}
      </div>

      <details className="tarjeta" style={{ marginTop: 16 }}>
        <summary>Más datos del sensor</summary>
        <table className="tabla">
          <tbody>
            <tr><th>Tono del zumbido</th><td>{num(ultima.sonido_hz, 0)} Hz · {tono(ultima.sonido_hz)}</td></tr>
            <tr><th>Temperatura de afuera</th><td>{num(ultima.temp_ext_c, 1)} °C</td></tr>
            <tr><th>Batería del sensor</th><td>{num(ultima.bateria_pct, 0)} %{ultima.bateria_pct < 15 ? " · cambiarla pronto" : ""}</td></tr>
            <tr><th>Última lectura</th><td>{fecha(ultima.ts)}</td></tr>
            <tr><th>Ubicación</th><td><a href={`https://www.google.com/maps?q=${c.lat},${c.lon}`} target="_blank" rel="noreferrer">{num(c.lat, 4)}, {num(c.lon, 4)} (abrir mapa)</a></td></tr>
          </tbody>
        </table>
      </details>

      <h2>Avisos anteriores</h2>
      {!alertas.length ? <p className="sub">Esta colmena no ha tenido avisos.</p> : (
        <div className="tarjeta">
          <table className="tabla">
            <tbody>
              {alertas.map((a) => (
                <tr key={a.alerta_id}>
                  <td style={{ width: 40 }} aria-hidden="true"><Icono nombre={a.tipo} /></td>
                  <td><b>{problema(a.tipo).titulo}</b><div className="chico">{fecha(a.recibido || a.ts)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
