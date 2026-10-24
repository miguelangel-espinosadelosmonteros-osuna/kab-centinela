"use client";

import { useEffect, useState } from "react";
import { callar, hablar, puedeHablar } from "@/lib/voz";
import Icono from "@/components/Icono";

const TELEFONO = process.env.NEXT_PUBLIC_TELEFONO_AYUDA || "";

/** Lee el texto en voz alta (para quien prefiere escuchar que leer). */
export function BotonEscuchar({ texto, etiqueta = "Escuchar" }) {
  const [hablando, setHablando] = useState(false);
  const [disponible, setDisponible] = useState(false);
  useEffect(() => {
    setDisponible(puedeHablar());
    return () => callar();
  }, []);
  if (!disponible) return null;
  return (
    <button className="boton" onClick={() => {
      if (hablando) { callar(); setHablando(false); return; }
      setHablando(hablar(texto, () => setHablando(false)));
    }}>
      <Icono nombre={hablando ? "detener" : "bocina"} />
      {hablando ? "Detener" : etiqueta}
    </button>
  );
}

/** Abre WhatsApp con el mensaje listo para mandar. */
export function BotonWhatsApp({ texto, etiqueta = "Avisar por WhatsApp" }) {
  return (
    <a className="boton whatsapp" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer">
      <Icono nombre="mensaje" />{etiqueta}
    </a>
  );
}

/** Llama al técnico de la cooperativa (si se configuró NEXT_PUBLIC_TELEFONO_AYUDA). */
export function BotonLlamar({ etiqueta = "Llamar al técnico" }) {
  if (!TELEFONO) return null;
  return (
    <a className="boton" href={`tel:${TELEFONO}`}>
      <Icono nombre="telefono" />{etiqueta}
    </a>
  );
}

export function urlActual() {
  return typeof window !== "undefined" ? window.location.href : "";
}
