"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/** La huella de la firma se escribe carácter por carácter (de golpe con "reducir movimiento"). */
export default function FirmaEscrita({ texto = "", activa = true }) {
  const reducido = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!activa) return;
    if (reducido) { setN(texto.length); return; }
    setN(0);
    const id = setInterval(() => setN((x) => (x >= texto.length ? (clearInterval(id), x) : x + 1)), 16);
    return () => clearInterval(id);
  }, [texto, activa, reducido]);
  return (
    <span className="dato firma" aria-label={texto}>
      <span aria-hidden="true">{texto.slice(0, n)}{n < texto.length && <span className="cursor" />}</span>
    </span>
  );
}
