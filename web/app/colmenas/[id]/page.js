"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/api";
import { Cargando, Insignia, Linea, hora, num } from "@/components/ui";

const SERIES = [
  ["peso_kg", "Peso", " kg", 2, "var(--miel)"],
  ["sonido_db", "Zumbido", " dB", 1, "var(--alerta)"],
  ["temp_int_c", "Temp. de cría", " °C", 1, "var(--critica)"],
  ["sonido_hz", "Tono del zumbido", " Hz", 0, "var(--sana)"],
  ["humedad_pct", "Humedad exterior", " %", 0, "var(--atencion)"],
  ["temp_ext_c", "Temp. exterior", " °C", 1, "var(--suave)"],
];

export default function DetalleColmena() {
  const { id } = useParams();
  const { datos, error } = useApi(`/colmenas/${id}`, 4000);
  if (!datos) return <Cargando error={error} />;
  const { colmena: c, lecturas, alertas } = datos;

  return (
    <>
      <p className="sub"><Link href="/">← Tablero</Link></p>
      <h1>{c.colmena_id} <Insignia valor={c.estado} /></h1>
      <p className="sub">
        {c.apiario_nombre} · {c.municipio} · {num(c.lat, 4)}, {num(c.lon, 4)} ·{" "}
        {c.conectada === false ? "sensor sin señal" : "sensor conectado"}
      </p>

      <div className="graficas">
        {SERIES.map(([campo, nombre, unidad, dec, color]) => {
          const valores = lecturas.map((l) => l[campo]);
          return (
            <div className="tarjeta grafica" key={campo}>
              <small className="sub">{nombre}</small>
              <div className="valor">{num(valores[valores.length - 1], dec, unidad)}</div>
              <Linea valores={valores} color={color} />
            </div>
          );
        })}
      </div>
      <p className="fuente">Últimas {lecturas.length} lecturas · última: {hora(lecturas.at(-1)?.ts)}</p>

      <h2>Alertas de esta colmena</h2>
      {!alertas.length ? <p className="sub">Sin alertas.</p> : (
        <ul className="lista">
          {alertas.map((a) => (
            <li key={a.alerta_id} className="tarjeta">
              <div className="linea"><Insignia valor={a.severidad} texto={a.severidad} /><strong>{a.titulo}</strong></div>
              <small>{hora(a.ts)}</small>
              <div>{a.mensaje}</div>
              <div><b>Qué hacer:</b> {a.recomendacion}</div>
              {["INTOXICACION", "BROTE_REGIONAL"].includes(a.tipo) && (
                <small><Link href="/expedientes">Ver expediente firmado →</Link></small>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
