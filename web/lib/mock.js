// Datos de demostración para ver el tablero antes de desplegar en AWS.
// Tienen la misma forma que las respuestas de la API real (backend/src/handlers/api.py).

const COLMENAS = [
  ["TEK-01", "TEK-NOH-A", "Nohalal A", "Tekax", 20.096, -89.33, "critica"],
  ["TEK-02", "TEK-NOH-A", "Nohalal A", "Tekax", 20.096, -89.33, "critica"],
  ["TEK-03", "TEK-NOH-A", "Nohalal A", "Tekax", 20.096, -89.33, "sana"],
  ["TEK-04", "TEK-NOH-B", "Nohalal B", "Tekax", 20.105, -89.32, "critica"],
  ["TEK-05", "TEK-NOH-B", "Nohalal B", "Tekax", 20.105, -89.32, "atencion"],
  ["PET-01", "PETO-01", "Peto Centro", "Peto", 20.1256, -88.9217, "sana"],
  ["PET-02", "PETO-01", "Peto Centro", "Peto", 20.1256, -88.9217, "alerta"],
];

const ahora = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const haceMin = (m) => new Date(Date.now() - m * 60000).toISOString().replace(/\.\d+Z$/, "Z");

const ALERTAS = [
  { tipo: "BROTE_REGIONAL", severidad: "critica", titulo: "Brote regional: patrón de fumigación", colmena_id: "TEK-04",
    apiario_id: "TEK-NOH-B", apiario_nombre: "Nohalal B", municipio: "Tekax",
    mensaje: "Intoxicación en 2 apiarios a 1.5 km o menos en menos de 6 h: patrón de fumigación.",
    recomendacion: "Avisa a los apicultores en 3 km y presenta la denuncia con el expediente firmado." },
  { tipo: "INTOXICACION", severidad: "critica", titulo: "Posible intoxicación por plaguicida", colmena_id: "TEK-04",
    apiario_id: "TEK-NOH-B", apiario_nombre: "Nohalal B", municipio: "Tekax",
    mensaje: "El zumbido cayó 15.5 dB y el peso 1.01 kg a la vez.",
    recomendacion: "Cierra la piquera, toma fotos y guarda abejas muertas en el congelador." },
  { tipo: "INTOXICACION", severidad: "critica", titulo: "Posible intoxicación por plaguicida", colmena_id: "TEK-01",
    apiario_id: "TEK-NOH-A", apiario_nombre: "Nohalal A", municipio: "Tekax",
    mensaje: "El zumbido cayó 14.9 dB y el peso 1.03 kg a la vez.",
    recomendacion: "Cierra la piquera, toma fotos y guarda abejas muertas en el congelador." },
  { tipo: "ENJAMBRAZON", severidad: "alta", titulo: "Enjambrazón: la colonia se dividió", colmena_id: "PET-02",
    apiario_id: "PETO-01", apiario_nombre: "Peto Centro", municipio: "Peto",
    mensaje: "El peso cayó 2.3 kg en menos de 40 min.",
    recomendacion: "Busca el enjambre cerca del apiario para capturarlo." },
  { tipo: "SEQUIA", severidad: "media", titulo: "Estrés por sequía", colmena_id: "TEK-05",
    apiario_id: "TEK-NOH-B", apiario_nombre: "Nohalal B", municipio: "Tekax",
    mensaje: "Humedad promedio de 27% con 37.8 °C en las últimas horas.",
    recomendacion: "Coloca bebederos con agua limpia y flotadores." },
].map((a, i) => ({ ...a, alerta_id: `ALR-demo${i}`, ts: haceMin(5 + i * 7), metricas: {} }));

function lecturas(id, estado) {
  const salida = [];
  for (let i = 0; i < 40; i++) {
    const malo = estado === "critica" && i > 30;
    salida.push({
      colmena_id: id,
      ts: haceMin((40 - i) * 10),
      peso_kg: +(42 + i * 0.01 - (malo ? (i - 30) * 0.12 : 0)).toFixed(2),
      temp_int_c: +(34.8 + Math.sin(i) * 0.3).toFixed(2),
      temp_ext_c: +(29 + Math.sin(i / 6) * 4).toFixed(2),
      humedad_pct: +(65 - Math.sin(i / 6) * 10).toFixed(1),
      sonido_db: +(72 + Math.sin(i / 6) * 2 - (malo ? (i - 30) * 1.6 : 0)).toFixed(1),
      sonido_hz: +(250 + Math.cos(i) * 10).toFixed(0),
    });
  }
  return salida;
}

function colmena([id, apiario_id, apiario_nombre, municipio, lat, lon, estado]) {
  const ls = lecturas(id, estado);
  const vigentes = ALERTAS.filter((a) => a.colmena_id === id).map((a) => ({
    tipo: a.tipo, severidad: a.severidad, titulo: a.titulo, ts: a.ts, alerta_id: a.alerta_id,
  }));
  return {
    colmena_id: id, apiario_id, apiario_nombre, municipio, lat, lon, estado,
    conectada: true, actualizado: ahora(), ultima_lectura: ls[ls.length - 1], alertas_vigentes: vigentes,
  };
}

const EXPEDIENTE = {
  tipo_documento: "EXPEDIENTE_INTOXICACION",
  version: 1,
  expediente_id: "EXP-20261024-TEK-01-demo01",
  generado_en: haceMin(4),
  alerta: {
    alerta_id: "ALR-demo2", tipo: "INTOXICACION", severidad: "critica", detectada_en: haceMin(19),
    descripcion: "El zumbido cayó 14.9 dB y el peso 1.03 kg a la vez.",
    metricas: { caida_sonido_db: 14.9, caida_peso_kg: 1.03, sonido_base_db: 72.4, sonido_actual_db: 57.5 },
  },
  ubicacion: { colmena_id: "TEK-01", apiario_nombre: "Nohalal A", municipio: "Tekax", estado: "Yucatán", lat: 20.096, lon: -89.33 },
  lecturas_sensor: lecturas("TEK-01", "critica").slice(-6),
};

const FIRMA_DEMO = { algoritmo: "ECDSA_SHA_256", llave: "demo", digest_sha256: "demo", valor_b64: "MEUCIQDdemo" };
const canonico = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
const pasaportes = {};

export async function mock(ruta, opciones = {}) {
  await new Promise((r) => setTimeout(r, 150));
  const metodo = (opciones.method || "GET").toUpperCase();
  const cuerpo = opciones.body ? JSON.parse(opciones.body) : {};
  const colmenas = COLMENAS.map(colmena);

  if (ruta.startsWith("/colmenas/")) {
    const id = ruta.split("/")[2].split("?")[0];
    const c = colmenas.find((x) => x.colmena_id === id);
    if (!c) throw new Error(`No existe la colmena ${id}`);
    return { colmena: c, lecturas: lecturas(id, c.estado), alertas: ALERTAS.filter((a) => a.colmena_id === id) };
  }
  if (ruta.startsWith("/colmenas")) {
    const apiarios = {};
    for (const c of colmenas) {
      const a = (apiarios[c.apiario_id] ||= { apiario_id: c.apiario_id, nombre: c.apiario_nombre,
        municipio: c.municipio, lat: c.lat, lon: c.lon, colmenas: [], estado: "sana" });
      a.colmenas.push(c.colmena_id);
      const orden = { sana: 1, atencion: 2, alerta: 3, critica: 4 };
      if (orden[c.estado] > orden[a.estado]) a.estado = c.estado;
    }
    const resumen = { total: colmenas.length, desconectadas: 0 };
    for (const e of ["critica", "alerta", "atencion", "sana"]) resumen[e] = colmenas.filter((c) => c.estado === e).length;
    return { colmenas, apiarios: Object.values(apiarios), resumen };
  }
  if (ruta.startsWith("/alertas")) return { alertas: ALERTAS };
  if (ruta === "/expedientes") {
    return { expedientes: [{ doc_id: EXPEDIENTE.expediente_id, creado: EXPEDIENTE.generado_en, colmena_id: "TEK-01",
      apiario_id: "TEK-NOH-A", tipo_alerta: "INTOXICACION", resumen: EXPEDIENTE.alerta.descripcion,
      narrativa_fuente: "plantilla (demo)", retencion_modo: "COMPLIANCE", retencion_hasta: haceMin(-1440) }] };
  }
  if (ruta.endsWith("/verificar") && metodo === "GET") {
    return { verificacion: { valida: true, motivo: "La firma es válida (modo demo).", fuente: "s3://demo (Object Lock COMPLIANCE)" } };
  }
  if (ruta.startsWith("/expedientes/")) {
    return { expediente: { doc_id: EXPEDIENTE.expediente_id, creado: EXPEDIENTE.generado_en,
      sobre: { documento: EXPEDIENTE, firma: FIRMA_DEMO },
      narrativa: "Modo demo: aquí aparece el expediente redactado por Amazon Bedrock a partir del JSON firmado.",
      narrativa_fuente: "plantilla (demo)",
      s3: { bucket: "kab-evidencia-demo", key: "expedientes/2026-10-24/EXP-demo.json", version_id: "demo",
        retencion_modo: "COMPLIANCE", retencion_hasta: haceMin(-1440) } } };
  }
  if (ruta === "/verificar") {
    const original = canonico(EXPEDIENTE) === canonico(cuerpo.sobre?.documento)
      || Object.values(pasaportes).some((p) => canonico(p.documento) === canonico(cuerpo.sobre?.documento));
    return { verificacion: { valida: original, motivo: original
      ? "La firma es válida: el documento no ha cambiado desde que se firmó."
      : "La firma NO es válida: el documento fue alterado después de firmarse." } };
  }
  if (ruta === "/llave-publica") return { algoritmo: "ECDSA_SHA_256 (P-256)", pem: "(modo demo)" };
  if (ruta === "/pasaportes" && metodo === "POST") {
    const ap = cuerpo.apiario_id || "PETO-01";
    const apto = !ap.startsWith("TEK");
    const id = "PAS-DEMO" + Math.floor(Math.random() * 9999);
    const documento = {
      tipo_documento: "PASAPORTE_MIEL", pasaporte_id: id, generado_en: ahora(),
      lote: { kg: cuerpo.kg, fecha_cosecha: cuerpo.fecha_cosecha, floracion: cuerpo.floracion },
      origen: { apiario_id: ap, municipio: apto ? "Peto" : "Tekax", estado: "Yucatán", region: "Península de Yucatán" },
      dictamen: apto ? "APTO" : "NO APTO", apto,
      motivos: apto ? ["Sin intoxicaciones registradas en 60 días ni a 3 km."] : ["INTOXICACION en el apiario hoy (TEK-01)"],
      denominacion_origen: { nombre: "Miel de la Península de Yucatán", elegible: apto },
    };
    pasaportes[id] = { documento, firma: FIRMA_DEMO };
    return { pasaporte_id: id, dictamen: documento.dictamen, sobre: pasaportes[id] };
  }
  if (ruta === "/pasaportes") {
    return { pasaportes: Object.values(pasaportes).map((p) => ({ doc_id: p.documento.pasaporte_id,
      creado: p.documento.generado_en, apiario_id: p.documento.origen.apiario_id, dictamen: p.documento.dictamen })) };
  }
  if (ruta.startsWith("/pasaportes/")) {
    const id = ruta.split("/")[2];
    const p = pasaportes[id];
    if (!p) throw new Error("En modo demo los pasaportes solo viven en esta pestaña.");
    return { pasaporte: { doc_id: id, sobre: p }, verificacion: { valida: true, motivo: "Firma válida (modo demo)." } };
  }
  throw new Error(`Ruta no simulada: ${ruta}`);
}
