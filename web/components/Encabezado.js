"use client";

import Link from "next/link";
import { MODO_DEMO } from "@/lib/api";
import Icono from "@/components/Icono";
import Logo from "@/components/Logo";

export default function Encabezado() {
  return (
    <header className="encabezado">
      {MODO_DEMO && <div className="aviso-demo">Datos de muestra: esta pantalla todavía no está conectada a las colmenas.</div>}
      <div className="contenedor">
        <Link href="/" className="marca" aria-label="KAB Centinela, inicio">
          <Logo />
          <span>KAB Centinela<small>Cuidamos tus colmenas</small></span>
        </Link>
        <Link href="/ayuda" className="boton-icono" aria-label="Ayuda"><Icono nombre="ayuda" /></Link>
      </div>
    </header>
  );
}
