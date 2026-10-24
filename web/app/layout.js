import "./globals.css";
import { Atkinson_Hyperlegible, Fraunces, IBM_Plex_Mono } from "next/font/google";
import Encabezado from "@/components/Encabezado";
import BarraInferior from "@/components/BarraInferior";
import Movimiento from "@/components/Movimiento";

// Títulos con calidez, texto hecho para leerse con poca vista, datos en monoespaciada
const titulo = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], variable: "--f-titulo" });
const texto = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-texto" });
const dato = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-dato" });

export const metadata = {
  title: "Kaab",
  description: "La colmena que escucha: avisos de envenenamiento, calor, sequía y más, con pruebas que nadie puede borrar.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf4e4" },
    { media: "(prefers-color-scheme: dark)", color: "#17110a" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX" className={`${titulo.variable} ${texto.variable} ${dato.variable}`}>
      <body>
        <Movimiento>
          <Encabezado />
          <main className="contenedor">{children}</main>
          <BarraInferior />
        </Movimiento>
      </body>
    </html>
  );
}
