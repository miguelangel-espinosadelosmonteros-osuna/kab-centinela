import "./globals.css";
import Barra from "@/components/Barra";

export const metadata = {
  title: "KAB Centinela",
  description: "La colmena que escucha: detecta intoxicación por plaguicidas y la convierte en evidencia firmada.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d99a00",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Barra />
        <main className="contenedor">{children}</main>
      </body>
    </html>
  );
}
