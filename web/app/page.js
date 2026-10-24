"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { Cargando, Insignia, hora, num } from "@/components/ui";

function TarjetaColmena({ c }) {
  const l = c.ultima_lectura || {};
  return (
    <Link href={`/colmenas/${c.colmena_id}`} className={`tarjeta colmena ${c.estado}`}>
      <div className="cabeza">
        <strong>{c.colmena_id}</strong>
        <span>
          {c.conectada === false && <Insignia valor="alerta" texto="Sin señal" />} <Insignia valor={c.estado} />
        </span>
      </div>
      <div className="datos">
        <div><span>Peso</span> {num(l.peso_kg, 1, " kg")}</div>
        <div><span>Cría</span> {num(l.temp_int_c, 1, " °C")}</div>
        <div><span>Zumbido</span> {num(l.sonido_db, 0, " dB")}</div>
        <div><span>Tono</span> {num(l.sonido_hz, 0, " Hz")}</div>
      </div>
      {c.alertas_vigentes?.length > 0 && (
        <ul>{c.alertas_vigentes.map((a) => <li key={a.tipo}>{a.titulo}</li>)}</ul>
      )}
    </Link>
  );
}

export default function Tablero() {
  const { datos, error } = useApi("/colmenas", 4000);
  const { datos: alertas } = useApi("/alertas?limite=15", 5000);

  if (!datos) return <Cargando error={error} />;
  const r = datos.resumen;

  return (
    <>
      <h1>Tablero de colmenas</h1>
      <p className="sub">Se actualiza solo cada 4 segundos.</p>
      {error && <div className="error">{error}</div>}

      <div className="resumen">
        <div className="tarjeta"><b>{r.total}</b><small>colmenas</small></div>
        <div className="tarjeta"><b style={{ color: "var(--sana)" }}>{r.sana}</b><small>sanas</small></div>
        <div className="tarjeta"><b style={{ color: "var(--atencion)" }}>{r.atencion}</b><small>atención</small></div>
        <div className="tarjeta"><b style={{ color: "var(--alerta)" }}>{r.alerta}</b><small>alerta</small></div>
        <div className="tarjeta"><b style={{ color: "var(--critica)" }}>{r.critica}</b><small>críticas</small></div>
      </div>

      {datos.colmenas.length === 0 && (
        <div className="tarjeta">Aún no llegan lecturas. Corre el simulador: <code>python simular_colmenas.py --modo iot</code></div>
      )}

      {datos.apiarios.map((a) => (
        <section key={a.apiario_id}>
          <h2>
            {a.nombre} <small className="sub">· {a.municipio}</small> <Insignia valor={a.estado} />
          </h2>
          <div className="rejilla">
            {datos.colmenas.filter((c) => c.apiario_id === a.apiario_id).map((c) => (
              <TarjetaColmena key={c.colmena_id} c={c} />
            ))}
          </div>
        </section>
      ))}

      <h2>Alertas recientes</h2>
      <div className="tarjeta">
        {!alertas?.alertas?.length ? <p className="sub">Sin alertas.</p> : (
          <ul className="lista">
            {alertas.alertas.map((a) => (
              <li key={a.alerta_id}>
                <div className="linea">
                  <Insignia valor={a.severidad} texto={a.severidad} />
                  <strong>{a.titulo}</strong>
                  <Link href={`/colmenas/${a.colmena_id}`}>{a.colmena_id}</Link>
                </div>
                <small>{hora(a.ts)} · {a.apiario_nombre || a.apiario_id} · {a.mensaje}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
