import { useId } from "react";

// Logotipo de KAB Centinela: panal de 7 celdas. Al centro, el zumbido (la colmena que escucha);
// alrededor, miel a distintos niveles. La misma geometría está en public/marca/*.svg y app/icon.svg.
const R = 9.6, r = 8.9, W = Math.sqrt(3) * R, DY = 1.5 * R, C = 32;
const hex = (x, y) => "M" + [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (Math.PI / 180) * (60 * i - 90);
  return `${(x + r * Math.cos(a)).toFixed(2)} ${(y + r * Math.sin(a)).toFixed(2)}`;
}).join("L") + "Z";
const CELDAS = [
  [C - W / 2, C - DY, 0.5], [C + W / 2, C - DY, 0.82],
  [C - W, C, 1], [C + W, C, 0.66],
  [C - W / 2, C + DY, 1], [C + W / 2, C + DY, 1],
];
const ZUMBIDO = [[-5.2, 3.2], [-2.6, 6.4], [0, 9.6], [2.6, 6.4], [5.2, 3.2]]
  .map(([dx, h]) => `M${C + dx} ${C - h / 2}v${h}`).join("");

export default function Logo({ tam = 36, titulo }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={tam} height={tam} viewBox="6 6 52 52" style={{ flex: "none" }}
      {...(titulo ? { role: "img", "aria-label": titulo } : { "aria-hidden": true })}>
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="8" x2="0" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f2c94c" /><stop offset=".55" stopColor="#e0a12b" /><stop offset="1" stopColor="#b5730f" />
        </linearGradient>
        {CELDAS.map(([x, y], i) => <clipPath key={i} id={`${id}c${i}`}><path d={hex(x, y)} /></clipPath>)}
      </defs>
      {CELDAS.map(([x, y, nivel], i) => (
        <g key={i}>
          <path d={hex(x, y)} fill="var(--logo-vacio)" />
          <rect clipPath={`url(#${id}c${i})`} x={x - r} width={2 * r} y={y + r - 2 * r * nivel} height={2 * r * nivel} fill={`url(#${id}m)`} />
        </g>
      ))}
      <path d={hex(C, C)} fill="var(--logo-trazo)" />
      <g fill="none" stroke="var(--logo-trazo)" strokeWidth="1.6" strokeLinejoin="round">
        {CELDAS.map(([x, y], i) => <path key={i} d={hex(x, y)} />)}
      </g>
      <path d={ZUMBIDO} stroke="var(--logo-zumbido)" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
