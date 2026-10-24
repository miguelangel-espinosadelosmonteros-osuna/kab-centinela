"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mock } from "./mock";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Sin NEXT_PUBLIC_API_URL el tablero funciona con datos de demostración.
export const MODO_DEMO = !BASE;

export async function api(ruta, opciones = {}) {
  if (MODO_DEMO) return mock(ruta, opciones);
  const r = await fetch(BASE + ruta, {
    ...opciones,
    headers: { "content-type": "application/json", ...(opciones.headers || {}) },
    cache: "no-store",
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

export function post(ruta, cuerpo) {
  return api(ruta, { method: "POST", body: JSON.stringify(cuerpo) });
}

/** Lee una ruta de la API y la vuelve a pedir cada `ms` milisegundos. */
export function useApi(ruta, ms = 4000) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const vivo = useRef(true);

  const cargar = useCallback(async () => {
    if (!ruta) return;
    try {
      const d = await api(ruta);
      if (vivo.current) {
        setDatos(d);
        setError(null);
      }
    } catch (e) {
      if (vivo.current) setError(e.message);
    }
  }, [ruta]);

  useEffect(() => {
    vivo.current = true;
    cargar();
    const id = ms ? setInterval(cargar, ms) : null;
    return () => {
      vivo.current = false;
      if (id) clearInterval(id);
    };
  }, [cargar, ms]);

  return { datos, error, recargar: cargar };
}
