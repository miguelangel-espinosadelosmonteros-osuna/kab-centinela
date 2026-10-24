"use client";

import Link from "next/link";
import { ESTADOS, PROBLEMAS } from "@/lib/textos";
import { IconoEstado, claseEstado } from "@/components/ui";
import { BotonEscuchar } from "@/components/Acciones";

const GUIA =
  "Bienvenido a KAB Centinela. Cada colmena tiene un sensor que la escucha, la pesa y mide su calor. " +
  "Verde con palomita quiere decir que está bien. Amarillo o naranja con triángulo quiere decir que hay que revisarla. " +
  "Rojo con el signo de alto quiere decir que es urgente. Toca una colmena para ver qué le pasa y qué hacer. " +
  "Con el botón de la bocina, el teléfono te lee las instrucciones.";

export default function Ayuda() {
  return (
    <>
      <h1>¿Cómo se usa?</h1>
      <p className="sub">KAB Centinela escucha, pesa y mide el calor de cada colmena, y te avisa si algo anda mal.</p>
      <BotonEscuchar texto={GUIA} etiqueta="Escuchar la explicación" />

      <h2>Qué significan los colores</h2>
      <div className="pila">
        {["sana", "atencion", "alerta", "critica"].map((e) => (
          <div key={e} className={`banner ${claseEstado(e)}`}>
            <IconoEstado estado={e} />
            <div><strong>{ESTADOS[e].palabra}</strong><span>{ESTADOS[e].frase}</span></div>
          </div>
        ))}
      </div>

      <h2>Los botones</h2>
      <div className="tarjeta">
        <table className="tabla">
          <tbody>
            <tr><td style={{ fontSize: "1.6rem", width: 48 }}>🔊</td><td><b>Escuchar</b>: el teléfono te lee el aviso en voz alta.</td></tr>
            <tr><td style={{ fontSize: "1.6rem" }}>💬</td><td><b>WhatsApp</b>: manda el aviso a tus vecinos o a tu cooperativa.</td></tr>
            <tr><td style={{ fontSize: "1.6rem" }}>🛡️</td><td><b>Prueba</b>: guarda lo que pasó para que puedas denunciar.</td></tr>
            <tr><td style={{ fontSize: "1.6rem" }}>🍯</td><td><b>Mi miel</b>: crea un certificado para vender tu miel a mejor precio.</td></tr>
            <tr><td style={{ fontSize: "1.3rem", fontWeight: 700 }}>AA</td><td><b>Letra grande</b>: arriba a la derecha, para ver todo más grande.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Qué puede avisarte</h2>
      <div className="pila">
        {Object.entries(PROBLEMAS).map(([tipo, p]) => (
          <div key={tipo} className="tarjeta" style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: "2rem" }} aria-hidden="true">{p.emoji}</span>
            <div><b>{p.titulo}</b><p style={{ margin: "2px 0 0" }}>{p.explicacion}</p></div>
          </div>
        ))}
      </div>

      <h2>¿Por qué existe?</h2>
      <p>En Nohalal, Tekax, una fumigación envenenó cientos de colmenas y nadie fue sancionado porque no había pruebas.</p>
      <Link href="/problema" className="boton ancho">Conocer el problema</Link>
    </>
  );
}
