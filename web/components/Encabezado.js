"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MODO_DEMO } from "@/lib/api";
import Icono from "@/components/Icono";

/** Logotipo: celda de miel con la onda del zumbido adentro. */
export function Logo({ tam = 36 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5z" fill="var(--miel)" />
      <path d="M12.5 17.5v5M16.25 13.5v13M20 10v20M23.75 14v12M27.5 17.5v5" stroke="#3a2414" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Encabezado() {
  const [grande, setGrande] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem("kab-letra") === "grande";
      setGrande(guardado);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.letra = grande ? "grande" : "";
    try {
      localStorage.setItem("kab-letra", grande ? "grande" : "normal");
    } catch {}
  }, [grande]);

  return (
    <header className="encabezado">
      {MODO_DEMO && <div className="aviso-demo">Datos de muestra: esta pantalla todavía no está conectada a las colmenas.</div>}
      <div className="contenedor">
        <Link href="/" className="marca" aria-label="KAB Centinela, inicio">
          <Logo />
          <span>KAB Centinela<small>Cuidamos tus colmenas</small></span>
        </Link>
        <button className="boton-icono" onClick={() => setGrande(!grande)} aria-pressed={grande}
          aria-label={grande ? "Letra normal" : "Letra más grande"}>
          <Icono nombre="letra" />
        </button>
        <Link href="/ayuda" className="boton-icono" aria-label="Ayuda"><Icono nombre="ayuda" /></Link>
      </div>
    </header>
  );
}
