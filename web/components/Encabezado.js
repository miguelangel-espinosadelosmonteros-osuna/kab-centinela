"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MODO_DEMO } from "@/lib/api";

export function Logo({ tam = 36 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 3l14 8v18l-14 8-14-8V11z" fill="var(--miel)" />
      <ellipse cx="20" cy="22" rx="6.5" ry="8" fill="#1b1813" />
      <path d="M14 20h12M14 24.5h12" stroke="var(--miel)" strokeWidth="2.2" />
      <ellipse cx="14" cy="13.5" rx="5" ry="3.2" fill="#fff" opacity=".9" transform="rotate(-25 14 13.5)" />
      <ellipse cx="26" cy="13.5" rx="5" ry="3.2" fill="#fff" opacity=".9" transform="rotate(25 26 13.5)" />
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
          <span style={{ fontSize: "0.85rem" }}>A</span><span style={{ fontSize: "1.25rem" }}>A</span>
        </button>
        <Link href="/ayuda" className="boton-icono" aria-label="Ayuda">?</Link>
      </div>
    </header>
  );
}
