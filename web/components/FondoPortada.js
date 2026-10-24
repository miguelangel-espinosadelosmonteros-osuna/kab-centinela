"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fondo de la portada: panal que se llena de miel en loop (hecho en video/, composición FondoPanal).
 * Empieza con la imagen fija y solo cambia a video si la persona no pidió "reducir movimiento".
 */
export default function FondoPortada() {
  const [mover, setMover] = useState(false);
  const video = useRef(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setMover(!mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);
  // algunos navegadores no respetan autoPlay en un video que aparece después de cargar
  useEffect(() => { if (mover) video.current?.play().catch(() => {}); }, [mover]);
  return (
    <div className="fondo-portada" aria-hidden="true">
      {mover
        ? (
          <video ref={video} poster="/marca/fondo-panal.jpg" autoPlay muted loop playsInline preload="auto">
            <source src="/marca/fondo-panal.mp4" type="video/mp4" />
            <source src="/marca/fondo-panal.webm" type="video/webm" />
          </video>
        )
        : <img src="/marca/fondo-panal.jpg" alt="" />}
    </div>
  );
}
