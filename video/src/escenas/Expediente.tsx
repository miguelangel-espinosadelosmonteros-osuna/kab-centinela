import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, DATO, DATOS, TEXTO, TITULO, fijo } from "../marca";
import { Icono, Titular } from "./piezas";

const BORDE = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const rr = 44 + (i % 2 ? 3.2 : -1.2) + Math.sin(i * 1.7) * 1.4;
  return `${(48 + Math.cos(a) * rr).toFixed(1)},${(52 + Math.sin(a) * rr).toFixed(1)}`;
}).join(" ");

const Lacre = () => (
  <svg viewBox="0 0 96 104" width="100%" height="100%">
    <defs>
      <radialGradient id="cera-lacre" cx=".38" cy=".32" r=".8">
        <stop offset="0" stopColor="#c0503a" /><stop offset=".55" stopColor={C.lacre} /><stop offset="1" stopColor="#5a1a10" />
      </radialGradient>
    </defs>
    <polygon points={BORDE} fill="url(#cera-lacre)" />
    <path d="M48 20 74 35v30L48 80 22 65V35z" fill="none" stroke="#e9a08c" strokeWidth="2" opacity=".75" />
    <path d="M48 27 68 38.5v23L48 73 28 61.5v-23z" fill="none" stroke="#5a1a10" strokeWidth="1.2" opacity=".6" />
    <g transform="translate(36 30)" fill="none" stroke="#f3c2b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7.3" r="1.9" /><ellipse cx="12" cy="14.6" rx="3.8" ry="5.2" />
      <path d="M8.4 13h7.2M8.6 16.2h6.8M8.6 10.6C6.5 7.4 3 8.3 3.6 10.6c.5 1.8 3.3 1.9 5 1.1M15.4 10.6c2.1-3.2 5.6-2.3 5 0-.5 1.8-3.3 1.9-5 1.1" />
    </g>
    <text x="48" y="70" textAnchor="middle" fontFamily={DATO} fontSize="9" fill="#f3c2b3" letterSpacing="1.5">KMS</text>
  </svg>
);

// El expediente aparece como papel, el lacre se estampa y la huella se escribe sola.
export const Expediente: React.FC = () => {
  const f = useCurrentFrame();
  const escrito = Math.round(interpolate(f, [34, 84], [0, DATOS.huella.length], fijo));
  const fila = (k: string, v: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 18, padding: "10px 0", borderBottom: "1px solid rgba(224,161,43,.25)" }}>
      <span style={{ color: C.propoleo2 }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#d9c7a1" }}>
      <Titular titulo="Una prueba que nadie puede borrar" sub="Firmada con AWS KMS y guardada en S3 con Object Lock." ancho={720} />
      <div style={{
        position: "absolute", right: 110, top: 150, width: 900, background: C.papel, color: C.propoleo,
        padding: "48px 54px", boxShadow: "0 30px 60px -30px rgba(58,36,20,.55)", fontFamily: TEXTO, fontSize: 30,
        opacity: interpolate(f, [0, 10], [0, 1], fijo), translate: `0px ${interpolate(f, [0, 14], [30, 0], fijo)}px`,
        backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 47px, rgba(224,161,43,.14) 47px 48px)",
      }}>
        <div style={{ position: "absolute", right: 46, top: 36, width: 170, height: 184,
          opacity: interpolate(f, [16, 22], [0, 1], fijo),
          scale: String(interpolate(f, [16, 26], [1.8, 1], { ...fijo, easing: (t) => t * t })),
          rotate: `${interpolate(f, [16, 26], [-24, -8], fijo)}deg` }}><Lacre /></div>
        <div style={{ borderBottom: `3px solid ${C.propoleo}`, paddingBottom: 18, marginRight: 200 }}>
          <div style={{ fontFamily: DATO, fontSize: 22, letterSpacing: "0.12em", color: C.mielProfunda }}>EXPEDIENTE DE INTOXICACIÓN</div>
          <div style={{ fontFamily: TITULO, fontWeight: 600, fontSize: 56, lineHeight: 1.1, marginTop: 6 }}>Colmena TEK-01</div>
          <div style={{ color: C.propoleo2 }}>Nohalal A, Tekax, Yucatán</div>
        </div>
        <div style={{ marginTop: 18 }}>
          {fila("Zumbido", `Bajó ${DATOS.dbAntes - DATOS.dbAhora} dB (de ${DATOS.dbAntes} a ${DATOS.dbAhora})`)}
          {fila("Peso", `Perdió ${(DATOS.pesoAntes - DATOS.pesoAhora).toFixed(2)} kg`)}
          {fila("Firma", "ECDSA P-256 con AWS KMS")}
        </div>
        <div style={{
          display: "inline-flex", gap: 12, alignItems: "center", marginTop: 26, padding: "12px 30px 12px 22px", background: C.propoleo, color: C.cera,
          fontWeight: 700, fontSize: 28, clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)",
          opacity: interpolate(f, [28, 36], [0, 1], fijo),
        }}><Icono nombre="candado" tam={32} grosor={2} />Inmutable: S3 Object Lock</div>
        <div style={{ marginTop: 30, borderTop: `2px dashed ${C.cera3}`, paddingTop: 18 }}>
          <div style={{ fontFamily: DATO, fontSize: 20, letterSpacing: "0.12em", color: C.mielProfunda }}>HUELLA SHA-256</div>
          <div style={{ fontFamily: DATO, fontSize: 30, wordBreak: "break-all", marginTop: 8, minHeight: 80 }}>
            {DATOS.huella.slice(0, escrito)}
            {escrito < DATOS.huella.length && <span style={{ display: "inline-block", width: 16, height: 30, background: C.miel, verticalAlign: -4 }} />}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
