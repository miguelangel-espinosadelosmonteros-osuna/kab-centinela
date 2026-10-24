import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, DATO, DATOS, MIEL, TEXTO, fijo } from "../marca";
import { Icono, Titular } from "./piezas";

const KM = 120; // px por km en el mapa
const A = { x: 360, y: 340 };
const B = { x: 360 + DATOS.km * KM * 0.74, y: 340 - DATOS.km * KM * 0.67 }; // Nohalal B queda al noreste

const Marcador: React.FC<{ p: { x: number; y: number }; urgente: number; nombre: string; abajo?: boolean }> = ({ p, urgente, nombre, abajo }) => (
  <g>
    <polygon points="0,-34 29,-17 29,17 0,34 -29,17 -29,-17" transform={`translate(${p.x} ${p.y})`}
      fill={urgente > 0.5 ? C.alerta : C.monte} stroke={C.cera} strokeWidth="3" />
    <path d={urgente > 0.5 ? "M0 -13v14M0 12v.2" : "M-10 1l7 7 13-14"} transform={`translate(${p.x} ${p.y})`}
      fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <text x={p.x} y={abajo ? p.y + 70 : p.y - 50} textAnchor="middle" fontFamily={TEXTO} fontWeight={700} fontSize="30"
      fill={C.propoleo} stroke={C.cera2} strokeWidth="8" paintOrder="stroke">{nombre}</text>
  </g>
);

// La onda sale de Nohalal A, alcanza a Nohalal B y llega el SMS.
export const Alerta: React.FC = () => {
  const f = useCurrentFrame();
  const onda = (desde: number, p: { x: number; y: number }) => {
    const t = interpolate(f, [desde, desde + 34], [0, 1], { ...fijo, easing: MIEL });
    return <circle cx={p.x} cy={p.y} r={8 + t * 3 * KM} fill="none" stroke={C.alerta} strokeWidth={6 - t * 5} opacity={t > 0 && t < 1 ? 1 - t : 0} />;
  };
  const urgenteB = interpolate(f, [30, 34], [0, 1], fijo);
  const sms = interpolate(f, [26, 40], [0, 1], { ...fijo, easing: MIEL });
  return (
    <AbsoluteFill style={{ background: C.cera }}>
      <Titular titulo="Avisa en minutos" sub="Por SMS y correo, con los pasos a seguir." />

      <div style={{ position: "absolute", left: 110, top: 400, width: 980, height: 580, borderRadius: 14, overflow: "hidden", background: C.cera2 }}>
        <svg width={980} height={580}>
          {[[40, 40, 220, 130], [300, 30, 180, 110], [640, 60, 260, 150], [60, 400, 250, 140], [720, 380, 220, 160], [420, 470, 200, 90]].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="4" fill="rgba(156,107,60,.09)" stroke="rgba(156,107,60,.22)" />
          ))}
          <path d="M-20 470 C 200 440, 330 380, 520 372 S 860 250, 1000 160" fill="none" stroke={C.cera3} strokeWidth="14" strokeLinecap="round" />
          <circle cx={A.x} cy={A.y} r={3 * KM} fill="rgba(166,60,41,.06)" stroke={C.alerta} strokeWidth="2.5" strokeDasharray="10 12"
            opacity={interpolate(f, [8, 20], [0, 1], fijo)} />
          {onda(2, A)}{onda(14, A)}{onda(32, B)}{onda(46, B)}
          <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={C.alerta} strokeWidth="3" strokeDasharray="8 8" opacity={urgenteB} />
          <text x={(A.x + B.x) / 2 + 26} y={(A.y + B.y) / 2 + 10} fontFamily={DATO} fontSize="28" fill={C.alerta} opacity={urgenteB}>{DATOS.km.toFixed(1)} km</text>
          <Marcador p={A} urgente={1} nombre="Nohalal A" abajo />
          <Marcador p={B} urgente={urgenteB} nombre="Nohalal B" />
          <text x="24" y="556" fontFamily={DATO} fontSize="22" fill={C.propoleo2}>Tekax, Yucatán · círculo = 3 km</text>
        </svg>
      </div>

      {/* el celular del apicultor */}
      <div style={{ position: "absolute", right: 150, top: 290, width: 430, height: 690, borderRadius: 54, background: "#2a1f13", padding: 14 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 42, background: C.noche, padding: "70px 22px", display: "grid", alignContent: "start", gap: 18 }}>
          <div style={{ fontFamily: TEXTO, color: C.crema, fontSize: 76, textAlign: "center", fontWeight: 400 }}>10:48</div>
          {[["Posible envenenamiento en la colmena TEK-01 (Nohalal A, Tekax). Cierra la piquera y no la muevas.", sms],
            [`Fumigación en la zona: 2 apiarios a ${DATOS.km.toFixed(1)} km. Avisa a tus vecinos.`, interpolate(f, [50, 62], [0, 1], { ...fijo, easing: MIEL })]].map(([texto, t], i) => (
            <div key={i} style={{
              background: C.cera, borderRadius: 22, padding: "16px 18px", display: "grid", gap: 6,
              opacity: t as number, translate: `0px ${(1 - (t as number)) * -40}px`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: TEXTO, fontWeight: 700, fontSize: 22, color: C.propoleo }}>
                <span style={{ color: C.alerta, display: "grid" }}><Icono nombre={i ? "BROTE_REGIONAL" : "INTOXICACION"} tam={28} /></span>
                KAB Centinela · SMS
              </div>
              <div style={{ fontFamily: TEXTO, fontSize: 24, lineHeight: 1.3, color: C.propoleo }}>{texto as string}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
