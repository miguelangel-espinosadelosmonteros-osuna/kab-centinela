"use client";

import * as m from "motion/react-m";

// borde irregular de cera derretida
const BORDE = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const r = 44 + (i % 2 ? 3.2 : -1.2) + Math.sin(i * 1.7) * 1.4;
  return `${(48 + Math.cos(a) * r).toFixed(1)},${(52 + Math.sin(a) * r).toFixed(1)}`;
}).join(" ");

/** Sello de lacre hexagonal con la abeja y "KMS". Se estampa al abrir el expediente. */
export default function Lacre() {
  return (
    <m.div className="lacre" aria-hidden="true"
      initial={{ opacity: 0, scale: 1.7, rotate: -22 }} animate={{ opacity: 1, scale: 1, rotate: -8 }}
      transition={{ delay: 0.3, duration: 0.38, ease: [0.5, 0, 0.75, 0] }}>
      <svg viewBox="0 0 96 104">
        <defs>
          <radialGradient id="cera-lacre" cx=".38" cy=".32" r=".8">
            <stop offset="0" stopColor="#c0503a" />
            <stop offset=".55" stopColor="var(--lacre)" />
            <stop offset="1" stopColor="#5a1a10" />
          </radialGradient>
        </defs>
        <polygon points={BORDE} fill="url(#cera-lacre)" />
        <path d="M48 20 74 35v30L48 80 22 65V35z" fill="none" stroke="#e9a08c" strokeWidth="2" opacity=".75" />
        <path d="M48 27 68 38.5v23L48 73 28 61.5v-23z" fill="none" stroke="#5a1a10" strokeWidth="1.2" opacity=".6" />
        <g transform="translate(36 30)" fill="none" stroke="#f3c2b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7.3" r="1.9" /><ellipse cx="12" cy="14.6" rx="3.8" ry="5.2" />
          <path d="M8.4 13h7.2M8.6 16.2h6.8M8.6 10.6C6.5 7.4 3 8.3 3.6 10.6c.5 1.8 3.3 1.9 5 1.1M15.4 10.6c2.1-3.2 5.6-2.3 5 0-.5 1.8-3.3 1.9-5 1.1" />
        </g>
        <text x="48" y="70" textAnchor="middle" fontFamily="var(--f-dato), monospace" fontSize="9" fontWeight="500" fill="#f3c2b3" letterSpacing="1.5">KMS</text>
      </svg>
    </m.div>
  );
}
