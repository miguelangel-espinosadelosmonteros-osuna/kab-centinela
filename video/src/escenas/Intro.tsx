import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CELDAS, C as CENTRO, hex, r } from "../../../web/components/Logo";
import { C, MIEL, TITULO, VARS_OSCURO, fijo } from "../marca";

// El panal del logo se construye celda por celda, la miel lo llena y aparece el nombre.
export const Intro: React.FC<{ conTexto?: boolean }> = ({ conTexto = true }) => {
  const f = useCurrentFrame();
  const celdas = [[CENTRO, CENTRO, 0], ...CELDAS] as [number, number, number][];
  return (
    <AbsoluteFill style={{ background: C.noche, ...VARS_OSCURO, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 36, translate: conTexto ? `0px ${interpolate(f, [44, 66], [90, 0], { ...fijo, easing: MIEL })}px` : undefined }}>
        <svg width={420} height={420} viewBox="6 6 52 52">
          <defs>
            <linearGradient id="miel-intro" x1="0" y1="8" x2="0" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={C.polen} /><stop offset=".55" stopColor={C.miel} /><stop offset="1" stopColor={C.mielMedia} />
            </linearGradient>
            {celdas.map(([x, y], i) => <clipPath key={i} id={`ci${i}`}><path d={hex(x, y)} /></clipPath>)}
          </defs>
          {celdas.map(([x, y, nivel], i) => {
            const nace = 4 + i * 4;
            const llena = interpolate(f, [26 + i * 3, 52 + i * 3], [0, nivel], { ...fijo, easing: MIEL });
            const centro = i === 0;
            return (
              <g key={i} style={{
                opacity: interpolate(f, [nace, nace + 8], [0, 1], fijo),
                scale: String(interpolate(f, [nace, nace + 12], [0.3, 1], { ...fijo, easing: MIEL })),
                transformOrigin: `${x}px ${y}px`, transformBox: "view-box",
              }}>
                <path d={hex(x, y)} fill={centro ? C.crema : C.noche2} />
                {!centro && <rect clipPath={`url(#ci${i})`} x={x - r} width={2 * r} y={y + r - 2 * r * llena} height={2 * r * llena} fill="url(#miel-intro)" />}
                <path d={hex(x, y)} fill="none" stroke={C.crema} strokeWidth="1.6" strokeLinejoin="round" />
              </g>
            );
          })}
        </svg>
        {conTexto && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: TITULO, fontWeight: 700, fontSize: 150, lineHeight: 0.95, letterSpacing: "-0.025em", color: C.crema,
              opacity: interpolate(f, [52, 66], [0, 1], fijo),
            }}>
              KAB <span style={{ fontStyle: "italic", fontWeight: 400, color: "#f6c766" }}>Centinela</span>
            </div>
            <div style={{
              fontFamily: TITULO, fontStyle: "italic", fontSize: 58, color: C.crema2, marginTop: 18,
              opacity: interpolate(f, [64, 78], [0, 1], fijo),
            }}>La colmena que escucha.</div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
