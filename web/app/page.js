"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "@/lib/api";
import { Cargando, Chip, IconoEstado, claseEstado, hace, saludo } from "@/components/ui";
import TarjetaAviso from "@/components/TarjetaAviso";
import Panal from "@/components/Panal";

const Mapa = dynamic(() => import("@/components/Mapa"), { ssr: false, loading: () => <div className="mapa" /> });

// Cada recuadro del resumen filtra la lista de colmenas
const FILTROS = {
  bien: { titulo: "Colmenas que están bien", estados: ["sana"] },
  revisar: { titulo: "Colmenas para revisar", estados: ["alerta", "atencion"] },
  urgente: { titulo: "Colmenas con ayuda urgente", estados: ["critica"] },
};

function Resumen({ r, filtro, elegir }) {
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
        {[["bien", "sana", r.sana, "Bien"], ["revisar", "atencion", r.alerta + r.atencion, "Revisar"],
          ["urgente", "critica", r.critica, "Urgente"]].map(([clave, estado, cuantas, texto]) => (
          <button key={clave} type="button" className={`cifra ${claseEstado(estado)}`} aria-pressed={filtro === clave}
            onClick={() => elegir(filtro === clave ? null : clave)} aria-label={`Ver ${cuantas} colmenas: ${texto}`}>
            <IconoEstado estado={estado} /><b>{cuantas}</b><span>{texto}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function Inicio() {
  const { datos, error, recargar } = useApi("/colmenas", 5000);
  const { datos: avisos } = useApi("/alertas?limite=40", 6000);
  const [filtro, setFiltro] = useState(null);
  const elegir = useCallback((f) => {
    setFiltro(f);
    if (f) setTimeout(() => document.getElementById("lista-colmenas")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);
  const irApiario = useCallback((a) => {
    document.getElementById(`apiario-${a.apiario_id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const apiarios = useMemo(() => datos?.apiarios || [], [datos]);
  // apiarios de cada fumigación en la zona, para que la onda vaya de uno a otro en el mapa
  const brotes = useMemo(() => {
    const vistos = new Set();
    return (avisos?.alertas || [])
      .filter((a) => a.tipo === "BROTE_REGIONAL" && a.metricas?.apiarios?.length > 1)
      .map((a) => a.metricas.apiarios)
      .filter((b) => !vistos.has(b.join()) && vistos.add(b.join()));
  }, [avisos]);

  if (!datos) return <Cargando error={error} recargar={recargar} />;

  const urgentesHoy = (avisos?.alertas || []).filter((a) => ["critica", "alta"].includes(a.severidad)).length;
  const visibles = filtro ? datos.colmenas.filter((c) => FILTROS[filtro].estados.includes(c.estado)) : datos.colmenas;

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
      <h1>{saludo()}</h1>
      <p className="sub">Así están tus colmenas ahora.</p>
      <Resumen r={datos.resumen} filtro={filtro} elegir={elegir} />

      {datos.colmenas.length === 0 && (
        <div className="tarjeta" style={{ marginTop: 16 }}>Todavía no llegan datos de tus colmenas.</div>
      )}

      {importantes.length > 0 && (
        <>
          <h2>Atiende primero</h2>
          <div className="pila">
            {importantes.map((a) => <TarjetaAviso key={a.alerta_id} alerta={a} />)}
          </div>
        </>
      )}
      {/* La única entrada a la lista de avisos (ya no hay pestaña) */}
      <p style={{ marginTop: 12 }}>
        <Link href="/avisos" className={`boton ancho ${urgentesHoy ? "primario" : ""}`}>
          {urgentesHoy ? `Ver todos los avisos (${urgentesHoy} urgentes o para hoy)` : "Ver todos los avisos"}
        </Link>
      </p>

      <h2>Dónde están tus apiarios</h2>
      <Mapa apiarios={apiarios} brotes={brotes} alTocar={irApiario} />
      <p className="chico">Toca un apiario en el mapa para ver sus colmenas. El círculo punteado marca 3 km alrededor de un envenenamiento.</p>

      <div id="lista-colmenas" style={{ scrollMarginTop: 80 }}>
        <h2>{filtro ? `${FILTROS[filtro].titulo} (${visibles.length})` : "Tus apiarios"}</h2>
        {filtro && (
          <p><button type="button" className="boton ancho" onClick={() => setFiltro(null)}>Ver todas las colmenas</button></p>
        )}
        {filtro && visibles.length === 0 && <div className="tarjeta">No hay colmenas en este grupo.</div>}
      </div>
      <div className="pila" style={{ gap: 28 }}>
        {apiarios.filter((a) => visibles.some((c) => c.apiario_id === a.apiario_id)).map((a) => (
          <section key={a.apiario_id} id={`apiario-${a.apiario_id}`} style={{ scrollMarginTop: 80 }}>
            <div className="apiario-cabeza">
              <div>
                <h3>{a.nombre}</h3>
                <div className="chico">{a.municipio}{a.apicultor ? ` · ${a.apicultor}` : ""}</div>
              </div>
              <Chip estado={a.estado} />
            </div>
            <Panal colmenas={visibles.filter((c) => c.apiario_id === a.apiario_id)} />
          </section>
        ))}
      </div>
      <p className="chico" style={{ marginTop: 16 }}>Última actualización: {hace(datos.colmenas[0]?.actualizado)}</p>
    </>
  );
}
