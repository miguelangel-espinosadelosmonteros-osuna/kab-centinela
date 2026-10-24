import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./marca";

// Fondo en loop para la portada: retícula de panal donde algunas celdas se llenan y vacían de miel,
// como una ola lenta. Todo depende de frame / duración, así que el último cuadro empata con el primero.
const R = 34, W = Math.sqrt(3) * R;
const hex = (x: number, y: number, rr: number) => "M" + [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (Math.PI / 180) * (60 * i - 90);
  return `${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`;
}).join("L") + "Z";

export const FondoPanal: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const celdas: { x: number; y: number; con: boolean; d: number }[] = [];
  for (let fila = -1; fila * 1.5 * R < height + R; fila++) {
    for (let col = -1; col * W < width + W; col++) {
      const x = col * W + (fila % 2 ? W / 2 : 0), y = fila * 1.5 * R;
      const azar = Math.abs(Math.sin(col * 12.9898 + fila * 78.233) * 43758.5453) % 1;
      celdas.push({ x, y, con: azar < 0.34, d: (x * 0.8 + y) / 900 + azar * 0.6 });
    }
  }
  const t = f / durationInFrames;
  return (
    <AbsoluteFill style={{ background: C.cera }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="miel-fondo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.polen} /><stop offset="1" stopColor={C.miel} />
          </linearGradient>
          {celdas.map((c, i) => c.con && <clipPath key={i} id={`f${i}`}><path d={hex(c.x, c.y, R - 3)} /></clipPath>)}
        </defs>
        {celdas.map((c, i) => {
          const nivel = c.con ? 0.5 + 0.5 * Math.sin(2 * Math.PI * (t - c.d)) : 0;
          return (
            <g key={i}>
              {c.con && <rect clipPath={`url(#f${i})`} x={c.x - R} width={2 * R} y={c.y + R - 2 * R * nivel} height={2 * R} fill="url(#miel-fondo)" opacity=".5" />}
              <path d={hex(c.x, c.y, R - 3)} fill="none" stroke={C.cera3} strokeWidth="2" />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
