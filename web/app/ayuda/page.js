"use client";

import Link from "next/link";
import { ESTADOS, PROBLEMAS } from "@/lib/textos";
import { IconoEstado, claseEstado } from "@/components/ui";
import Icono from "@/components/Icono";
import { BotonEscuchar } from "@/components/Acciones";

const GUIA =
  "Bienvenido a KAB Centinela. Cada colmena tiene un sensor que la escucha, la pesa y mide su calor. " +
  "La celda verde con palomita quiere decir que está bien. La celda naranja quiere decir que hay que revisarla: " +
  "con reloj, en estos días; con signo de admiración, hoy. La celda roja es urgente. Si la celda está gris y punteada, el sensor no responde. Toca una colmena para ver qué le pasa y qué hacer. " +
  "Con el botón de la bocina, el teléfono te lee las instrucciones.";

// color de cada aviso en la guía (el mismo que usa la detección)
const SEVERIDAD = {
  INTOXICACION: "critica", BROTE_REGIONAL: "critica", GOLPE_CALOR: "alerta", FRIO_EXTREMO: "alerta", AUSENCIA_REINA: "alerta",
  ENJAMBRAZON: "alerta", SEQUIA: "atencion", HAMBRUNA: "atencion", VARROA_ENFERMEDAD: "atencion", DESCONEXION: "atencion", BATERIA_BAJA: "atencion",
};

export default function Ayuda() {
  return (
    <>
      <h1>¿Cómo se usa?</h1>
      <p className="sub">KAB Centinela escucha, pesa y mide el calor de cada colmena, y te avisa si algo anda mal.</p>
      <BotonEscuchar texto={GUIA} etiqueta="Escuchar la explicación" />

      <h2>Qué significan los colores</h2>
      <div className="pila">
        {["sana", "atencion", "alerta", "critica", "apagada"].map((e) => (
          <div key={e} className={`banner ${claseEstado(e)}`}>
            <IconoEstado estado={e} titulo="" />
            <div><strong>{ESTADOS[e].palabra}</strong><span>{ESTADOS[e].frase}</span></div>
          </div>
        ))}
      </div>

      <h2>Los botones</h2>
      <div className="tarjeta">
        <table className="tabla">
          <tbody>
            <tr><td style={{ width: 48 }} aria-hidden="true"><Icono nombre="bocina" tam={28} /></td><td><b>Escuchar</b>: el teléfono te lee el aviso en voz alta.</td></tr>
            <tr><td style={{ width: 48 }} aria-hidden="true"><Icono nombre="mensaje" tam={28} /></td><td><b>WhatsApp</b>: manda el aviso a tus vecinos o a tu cooperativa.</td></tr>
            <tr><td style={{ width: 48 }} aria-hidden="true"><Icono nombre="escudo" tam={28} /></td><td><b>Prueba</b>: guarda lo que pasó para que puedas denunciar.</td></tr>
            <tr><td style={{ width: 48 }} aria-hidden="true"><Icono nombre="frasco" tam={28} /></td><td><b>Mi miel</b>: crea un certificado para vender tu miel a mejor precio.</td></tr>
            <tr><td aria-hidden="true"><Icono nombre="letra" tam={28} /></td><td><b>Letra grande</b>: arriba a la derecha, para ver todo más grande.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Qué puede avisarte</h2>
      <div className="pila">
        {Object.entries(PROBLEMAS).map(([tipo, p]) => (
          <div key={tipo} className="tarjeta" style={{ display: "flex", gap: 12 }}>
            <span className={`disco ${claseEstado(SEVERIDAD[tipo])}`} aria-hidden="true"><Icono nombre={tipo} tam={28} grosor={1.9} /></span>
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
