import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, DATO, DATOS, MIEL, TEXTO, fijo } from "../marca";
import { CeldaColmena, Icono, Titular, onda } from "./piezas";

// Pasa una avioneta fumigando: el zumbido se aplana, la colmena pierde peso y las celdas pasan a urgente.
export const Fumigacion: React.FC = () => {
  const f = useCurrentFrame();
  const cae = interpolate(f, [40, 62], [0, 1], { ...fijo, easing: MIEL });
  const db = DATOS.dbAntes + (DATOS.dbAhora - DATOS.dbAntes) * cae;
  const peso = DATOS.pesoAntes + (DATOS.pesoAhora - DATOS.pesoAntes) * cae;
  const fase = f * (0.34 - 0.24 * cae); // con veneno la onda va más lenta
  return (
    <AbsoluteFill style={{ background: C.cera }}>
      <Titular titulo="Fumigan cerca de Nohalal"
        sub={`El zumbido cae ${DATOS.dbAntes - DATOS.dbAhora} dB y la colmena pierde ${(DATOS.pesoAntes - DATOS.pesoAhora).toFixed(1)} kg.`} />

      {/* la avioneta cruza rociando */}
      <div style={{
        position: "absolute", top: 300, color: C.propoleo2,
        left: interpolate(f, [4, 52], [-220, 2000], fijo), rotate: "90deg",
      }}><Icono nombre="BROTE_REGIONAL" tam={130} grosor={1.6} /></div>

      <div style={{ position: "absolute", left: 110, top: 470, display: "grid", gap: 18 }}>
        <div style={{ display: "flex", gap: 14 }}>
          {DATOS.colmenasA.map((id) => <CeldaColmena key={id} id={id} ancho={220} urgente={interpolate(f, [52, 64], [0, 1], fijo)} />)}
        </div>
        <div style={{ fontFamily: TEXTO, fontSize: 34, color: C.propoleo2 }}>Nohalal A · Tekax · Don Felipe Chi</div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 440, width: 820, background: C.noche, borderRadius: 14, padding: "28px 30px", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", color: C.crema }}>
          <span style={{ fontFamily: TEXTO, fontWeight: 700, fontSize: 34, display: "flex", gap: 12, alignItems: "center" }}>
            <Icono nombre="onda" tam={38} />Zumbido de TEK-01
          </span>
          <span style={{ fontFamily: DATO, fontSize: 64, color: C.miel }}>{Math.round(db)} <span style={{ fontSize: 30, color: C.crema2 }}>dB</span></span>
        </div>
        <svg width={760} height={200} viewBox="0 0 760 200">
          <line x1="0" x2="760" y1="100" y2="100" stroke="#3a2b19" />
          <path d={onda(db, DATOS.hzAhora, fase + 1.1, 760, 200)} fill="none" stroke={C.mielMedia} strokeWidth="2" opacity=".55" />
          <path d={onda(db, DATOS.hzAhora, fase, 760, 200)} fill="none" stroke="#f2b544" strokeWidth="4" strokeLinejoin="round" />
        </svg>
        <div style={{ fontFamily: TEXTO, fontSize: 30, color: C.crema2, display: "flex", gap: 12, alignItems: "center" }}>
          <Icono nombre="peso" tam={34} />Peso <b style={{ fontFamily: DATO, fontWeight: 500, color: C.crema }}>{peso.toFixed(1)} kg</b>
        </div>
      </div>
    </AbsoluteFill>
  );
};
