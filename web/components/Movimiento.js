"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

// Carga solo las animaciones del DOM (~15 KB) y respeta "reducir movimiento" del teléfono:
// con esa preferencia, motion deja solo los cambios de opacidad.
export default function Movimiento({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
