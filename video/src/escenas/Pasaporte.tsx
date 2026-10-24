import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { QRCodeSVG } from "qrcode.react";
import { C, DATO, MIEL, TEXTO, TITULO, VARS_OSCURO, fijo } from "../marca";
import { CeldaMiel, Logo, Titular } from "./piezas";

// Ejemplo de lote del apiario fumigado (en la app el apicultor lo crea en "Mi miel")
const LOTE = { id: "PAS-DEMO1907", kg: 120, flor: "dzidzilché", apiario: "Nohalal A", lugar: "Tekax, Yucatán", cosecha: "20 oct 2026" };

// El pasaporte del lote se voltea al QR, la firma se verifica y cierra la marca.
export const Pasaporte: React.FC = () => {
  const f = useCurrentFrame();
  const giro = interpolate(f, [10, 30], [0, 180], { ...fijo, easing: MIEL });
  const cara: React.CSSProperties = { position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 26, overflow: "hidden", padding: "40px 38px", display: "grid", alignContent: "start", gap: 20 };
  const sale = interpolate(f, [60, 67], [1, 0], fijo); // primero se va el pasaporte
  const cierre = interpolate(f, [66, 76], [0, 1], fijo); // luego entra la marca
  return (
    <AbsoluteFill style={{ background: C.noche, ...VARS_OSCURO }}>
      <AbsoluteFill style={{ opacity: sale }}>
      <Titular titulo="El comprador lo verifica con un QR" color={C.crema} subColor={C.crema2} ancho={860}
        sub="Origen, lote y dictamen, firmados: si alguien cambia un dato, la firma deja de valer." />

      <div style={{ position: "absolute", left: 1150, top: 120, width: 600, height: 840, perspective: 2400 }}>
        <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", rotate: `y ${giro}deg` }}>
          <div style={{ ...cara, background: "#5c3a1f", color: C.cera }}>
            <div style={{ fontFamily: DATO, fontSize: 20, letterSpacing: "0.12em", color: C.polen }}>PASAPORTE DEL LOTE · KAB CENTINELA</div>
            <div style={{ fontFamily: TITULO, fontWeight: 600, fontSize: 54, lineHeight: 1.1 }}>{LOTE.kg} kg de miel de {LOTE.flor}</div>
            <div style={{ fontFamily: TEXTO, fontSize: 30, display: "grid", gridTemplateColumns: "190px 1fr", rowGap: 8 }}>
              <span style={{ color: C.cera3 }}>Apiario</span><b>{LOTE.apiario}</b>
              <span style={{ color: C.cera3 }}>Lugar</span><b>{LOTE.lugar}</b>
              <span style={{ color: C.cera3 }}>Cosecha</span><b>{LOTE.cosecha}</b>
            </div>
            <div style={{ marginTop: 30, background: C.cera, color: C.alerta, padding: "22px 34px", fontFamily: TITULO, fontWeight: 700, fontSize: 56,
              clipPath: "polygon(22px 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0 50%)" }}>
              No apta
              <div style={{ fontFamily: TEXTO, fontWeight: 400, fontSize: 24, color: C.propoleo }}>Envenenamiento en el apiario (colmena TEK-01)</div>
            </div>
          </div>
          <div style={{ ...cara, background: C.papel, color: C.propoleo, rotate: "y 180deg", justifyItems: "center", alignContent: "center", textAlign: "center" }}>
            <div style={{ fontFamily: DATO, fontSize: 22, letterSpacing: "0.12em", color: C.mielProfunda }}>EL COMPRADOR ESCANEA ESTE CÓDIGO</div>
            <div style={{ background: "#fff", padding: 22, borderRadius: 18 }}>
              <QRCodeSVG value={`https://kab-centinela.vercel.app/pasaporte/${LOTE.id}`} size={380} marginSize={1} fgColor={C.propoleo} />
            </div>
            <div style={{ fontFamily: DATO, fontSize: 28 }}>{LOTE.id}</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 110, top: 560, display: "flex", gap: 30, alignItems: "center", opacity: interpolate(f, [30, 38], [0, 1], fijo) }}>
        <CeldaMiel lleno={interpolate(f, [34, 52], [0, 1], { ...fijo, easing: MIEL })} check={interpolate(f, [48, 58], [0, 1], fijo)} tam={150} />
        <div style={{ fontFamily: TEXTO, color: C.crema }}>
          <div style={{ fontWeight: 700, fontSize: 52, opacity: interpolate(f, [50, 58], [0, 1], fijo) }}>Certificado auténtico</div>
          <div style={{ fontSize: 34, color: C.crema2 }}>Firma comprobada con AWS KMS</div>
        </div>
      </div>

      </AbsoluteFill>

      {/* cierre de marca */}
      <AbsoluteFill style={{ background: C.noche, opacity: cierre, alignItems: "center", justifyContent: "center", gap: 34, flexDirection: "column" }}>
        <div style={{ scale: String(interpolate(f, [66, 84], [0.85, 1], { ...fijo, easing: MIEL })) }}><Logo tam={260} /></div>
        <div style={{ fontFamily: TITULO, fontWeight: 700, fontSize: 130, lineHeight: 0.95, letterSpacing: "-0.025em", color: C.crema }}>
          KAB <span style={{ fontStyle: "italic", fontWeight: 400, color: "#f6c766" }}>Centinela</span>
        </div>
        <div style={{ fontFamily: TITULO, fontStyle: "italic", fontSize: 54, color: C.crema2 }}>La colmena que escucha.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
