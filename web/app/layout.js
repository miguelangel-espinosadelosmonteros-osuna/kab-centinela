import "./globals.css";
import { Atkinson_Hyperlegible } from "next/font/google";
import Encabezado from "@/components/Encabezado";
import BarraInferior from "@/components/BarraInferior";

// Tipografía diseñada para leerse fácil, incluso con poca vista
const fuente = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--fuente" });

export const metadata = {
  title: "KAB Centinela",
  description: "Cuidamos tus colmenas: avisos de envenenamiento, calor, sequía y más, con pruebas que nadie puede borrar.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e5a100",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={fuente.variable}>
      <body>
        <Encabezado />
        <main className="contenedor">{children}</main>
        <BarraInferior />
      </body>
    </html>
  );
}
