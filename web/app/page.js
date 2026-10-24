"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { useApi } from "@/lib/api";
import { ESTADOS, problema } from "@/lib/textos";
import { Cargando, Chip, IconoEstado, claseEstado, hace, saludo } from "@/components/ui";
import TarjetaAviso from "@/components/TarjetaAviso";

const Mapa = dynamic(() => import("@/components/Mapa"), { ssr: false, loading: () => <div className="mapa" /> });

function Resumen({ r }) {
  const urgentes = r.critica;
  const revisar = r.alerta + r.atencion;
  let estado = "sana", titulo = "Todas tus colmenas están bien", texto = "No tienes que hacer nada por ahora.";
  if (urgentes) {
    estado = "critica";
    titulo = urgentes === 1 ? "1 colmena necesita ayuda urgente" : `${urgentes} colmenas necesitan ayuda urgente`;
    texto = "Mira abajo qué hacer.";
  } else if (revisar) {
    estado = r.alerta ? "alerta" : "atencion";
    titulo = revisar === 1 ? "1 colmena necesita revisión" : `${revisar} colmenas necesitan revisión`;
    texto = "No es urgente, pero ve a verlas.";
  }
  return (
    <>
      <div className={`banner ${claseEstado(estado)}`} role="status">
        <IconoEstado estado={estado} />
        <div><strong>{titulo}</strong><span>{texto}</span></div>
      </div>
      <div className="resumen">
        <div className={`cifra ${claseEstado("sana")}`}><IconoEstado estado="sana" /><b>{r.sana}</b><span>Bien</span></div>
        <div className={`cifra ${claseEstado("atencion")}`}><IconoEstado estado="atencion" /><b>{r.alerta + r.atencion}</b><span>Revisar</span></div>
        <div className={`cifra ${claseEstado("critica")}`}><IconoEstado estado="critica" /><b>{r.critica}</b><span>Urgente</span></div>
      </div>
    </>
  );
}

export default function Inicio() {
  const { datos, error, recargar } = useApi("/colmenas", 5000);
  const { datos: avisos } = useApi("/alertas?limite=40", 6000);
  const irApiario = useCallback((a) => {
    document.getElementById(`apiario-${a.apiario_id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const apiarios = useMemo(() => datos?.apiarios || [], [datos]);

  if (!datos) return <Cargando error={error} recargar={recargar} />;

  // Un aviso por apiario (el más grave y luego el más reciente), solo urgentes y de "revisar hoy"
  const RANGO = { critica: 2, alta: 1 };
  const vistos = new Set();
  const importantes = (avisos?.alertas || [])
    .filter((a) => RANGO[a.severidad])
    .sort((x, y) => RANGO[y.severidad] - RANGO[x.severidad]
      || (y.tipo === "BROTE_REGIONAL") - (x.tipo === "BROTE_REGIONAL")
      || String(y.recibido || y.ts).localeCompare(String(x.recibido || x.ts)))
    .filter((a) => {
      if (vistos.has(a.apiario_id)) return false;
      vistos.add(a.apiario_id);
      return true;
    })
    .slice(0, 4);

  return (
    <>
      <h1>{saludo()} 👋</h1>
      <p className="sub">Así están tus colmenas ahora.</p>
      <Resumen r={datos.resumen} />

      {datos.colmenas.length === 0 && (
        <div className="tarjeta" style={{ marginTop: 16 }}>Todavía no llegan datos de tus colmenas.</div>
      )}

      {importantes.length > 0 && (
        <>
          <h2>Atiende primero</h2>
          <div className="pila">
            {importantes.map((a) => <TarjetaAviso key={a.alerta_id} alerta={a} />)}
          </div>
          <p style={{ marginTop: 10 }}><Link href="/avisos" className="boton ancho">Ver todos los avisos</Link></p>
        </>
      )}

      <h2>Dónde están tus apiarios</h2>
      <Mapa apiarios={apiarios} alTocar={irApiario} />
      <p className="chico">Toca un apiario en el mapa para ver sus colmenas. El círculo rojo marca 3 km alrededor de un envenenamiento.</p>

      <h2>Tus apiarios</h2>
      <div className="pila">
        {apiarios.map((a) => (
          <section key={a.apiario_id} id={`apiario-${a.apiario_id}`} className="tarjeta" style={{ scrollMarginTop: 80 }}>
            <div className="apiario-cabeza">
              <div>
                <h3 style={{ fontSize: "1.15rem" }}>{a.nombre}</h3>
                <div className="chico">{a.municipio}{a.apicultor ? ` · ${a.apicultor}` : ""}</div>
              </div>
              <Chip estado={a.estado} />
            </div>
            <div className="colmenas">
              {datos.colmenas.filter((c) => c.apiario_id === a.apiario_id).map((c) => {
                const peor = c.alertas_vigentes?.[0];
                return (
                  <Link key={c.colmena_id} href={`/colmenas/${c.colmena_id}`} className={`colmena ${claseEstado(c.estado)}`}>
                    <span className="nombre"><IconoEstado estado={c.estado} />{c.colmena_id}</span>
                    <span className="que">
                      {peor ? `${problema(peor.tipo).emoji} ${problema(peor.tipo).titulo}` : ESTADOS[c.estado]?.frase}
                    </span>
                    {c.conectada === false && <span className="que">📡 Sin señal</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="chico" style={{ marginTop: 16 }}>Última actualización: {hace(datos.colmenas[0]?.actualizado)}</p>
    </>
  );
}
