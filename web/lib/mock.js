// Modo demostración: el tablero funciona sin AWS (sin NEXT_PUBLIC_API_URL).
// Los datos salen del simulador:  python simular_colmenas.py --modo local --escenario mixto \
//                                   --velocidad 0 --exportar-demo ../web/lib/demo-datos.json
// Tienen la misma forma que la API real (backend/src/handlers/api.py).
import CRUDO from "./demo-datos.json";

const CAMPOS_FECHA = new Set(["ts", "recibido", "actualizado", "creado", "generado_en", "detectada_en"]);

// Corre todas las fechas para que los datos se vean "de ahora"
function moverFechas(obj, ms) {
  if (Array.isArray(obj)) return obj.map((x) => moverFechas(x, ms));
  if (obj && typeof obj === "object") {
    const salida = {};
    for (const [k, v] of Object.entries(obj)) {
      salida[k] = CAMPOS_FECHA.has(k) && typeof v === "string"
        ? new Date(Date.parse(v) + ms).toISOString().replace(/\.\d+Z$/, "Z")
        : moverFechas(v, ms);
    }
    return salida;
  }
  return obj;
}

let DATOS = null;
const pasaportes = {};

function datos() {
  if (!DATOS) DATOS = moverFechas(CRUDO, Date.now() - Date.parse(CRUDO.generado));
  return DATOS;
}

const ORDEN = { sana: 1, atencion: 2, alerta: 3, critica: 4 };

function apiarios(colmenas) {
  const mapa = {};
  for (const c of colmenas) {
    const a = (mapa[c.apiario_id] ||= {
      apiario_id: c.apiario_id, nombre: c.apiario_nombre, municipio: c.municipio, lat: c.lat, lon: c.lon,
      apicultor: c.apicultor, colmenas: [], estado: "sana",
    });
    a.colmenas.push(c.colmena_id);
    if (ORDEN[c.estado] > ORDEN[a.estado]) a.estado = c.estado;
  }
  return Object.values(mapa).sort((x, y) => ORDEN[y.estado] - ORDEN[x.estado] || x.nombre.localeCompare(y.nombre));
}

// JSON canónico (llaves ordenadas) para simular la verificación de firma
const canonico = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));

const ahora = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

export async function mock(ruta, opciones = {}) {
  await new Promise((r) => setTimeout(r, 120));
  const d = datos();
  const metodo = (opciones.method || "GET").toUpperCase();
  const cuerpo = opciones.body ? JSON.parse(opciones.body) : {};
  const [camino] = ruta.split("?");
  const partes = camino.split("/").filter(Boolean);

  if (partes[0] === "colmenas" && partes[1]) {
    const c = d.colmenas.find((x) => x.colmena_id === partes[1]);
    if (!c) throw new Error(`No existe la colmena ${partes[1]}`);
    return { colmena: c, lecturas: d.lecturas[c.colmena_id] || [], alertas: d.alertas.filter((a) => a.colmena_id === c.colmena_id) };
  }
  if (partes[0] === "colmenas") {
    const resumen = { total: d.colmenas.length, desconectadas: d.colmenas.filter((c) => c.conectada === false).length };
    for (const e of Object.keys(ORDEN)) resumen[e] = d.colmenas.filter((c) => c.estado === e).length;
    return { colmenas: d.colmenas, apiarios: apiarios(d.colmenas), resumen };
  }
  if (partes[0] === "alertas") return { alertas: d.alertas };

  if (partes[0] === "expedientes" && !partes[1]) {
    return { expedientes: d.expedientes.map(({ sobre, narrativa, ...resto }) => ({ ...resto, retencion_modo: "COMPLIANCE" })) };
  }
  if (partes[0] === "expedientes") {
    const e = d.expedientes.find((x) => x.doc_id === partes[1]);
    if (!e) throw new Error("No existe esa prueba");
    if (partes[2] === "verificar") return { verificacion: { valida: true, motivo: "La firma es válida (modo demostración).", fuente: "s3://demo" } };
    return { expediente: { ...e, s3: { bucket: "kab-evidencia-demo", key: `expedientes/${e.doc_id}.json`, version_id: "demo",
      retencion_modo: "COMPLIANCE", retencion_hasta: new Date(Date.parse(e.creado) + 86400e3).toISOString() } } };
  }
  if (partes[0] === "verificar") {
    const doc = canonico(cuerpo.sobre?.documento);
    const valida = d.expedientes.some((e) => canonico(e.sobre.documento) === doc)
      || Object.values(pasaportes).some((p) => canonico(p.documento) === doc);
    return { verificacion: { valida, motivo: valida
      ? "La firma es válida: el documento no ha cambiado desde que se firmó."
      : "La firma NO es válida: el documento fue alterado después de firmarse." } };
  }
  if (partes[0] === "llave-publica") return { algoritmo: "ECDSA_SHA_256 (P-256)", pem: "(modo demostración)" };

  if (partes[0] === "pasaportes" && metodo === "POST") {
    const a = apiarios(d.colmenas).find((x) => x.apiario_id === cuerpo.apiario_id) || apiarios(d.colmenas)[0];
    const malas = d.alertas.filter((x) => ["INTOXICACION", "BROTE_REGIONAL"].includes(x.tipo) && x.apiario_id === a.apiario_id);
    const apto = malas.length === 0;
    const id = "PAS-DEMO" + Math.floor(1000 + Math.random() * 9000);
    const documento = {
      tipo_documento: "PASAPORTE_MIEL", pasaporte_id: id, generado_en: ahora(),
      lote: { kg: cuerpo.kg, fecha_cosecha: cuerpo.fecha_cosecha, floracion: cuerpo.floracion, colmenas: a.colmenas },
      origen: { apiario_id: a.apiario_id, apiario_nombre: a.nombre, municipio: a.municipio, estado: "Yucatán",
        region: "Península de Yucatán", lat: a.lat, lon: a.lon, apicultor: a.apicultor },
      dictamen: apto ? "APTO" : "NO APTO", apto,
      motivos: apto ? ["Sin envenenamientos en 60 días ni a 3 km."] : malas.slice(0, 2).map((x) => `${x.tipo === "BROTE_REGIONAL" ? "Fumigación en la zona" : "Envenenamiento"} en el apiario (colmena ${x.colmena_id})`),
      denominacion_origen: { nombre: "Miel de la Península de Yucatán", elegible: apto,
        nota: "Evidencia de origen y sanidad del apiario; la certificación la otorga el organismo regulador." },
    };
    pasaportes[id] = { documento, firma: { algoritmo: "ECDSA_SHA_256", llave: "demo", valor_b64: "DEMO" } };
    return { pasaporte_id: id, dictamen: documento.dictamen, sobre: pasaportes[id] };
  }
  if (partes[0] === "pasaportes" && !partes[1]) {
    return { pasaportes: Object.values(pasaportes).map((p) => ({ doc_id: p.documento.pasaporte_id,
      creado: p.documento.generado_en, apiario_id: p.documento.origen.apiario_id, dictamen: p.documento.dictamen })) };
  }
  if (partes[0] === "pasaportes") {
    const p = pasaportes[partes[1]];
    if (!p) throw new Error("En modo demostración los certificados solo viven en esta pestaña.");
    return { pasaporte: { doc_id: partes[1], sobre: p }, verificacion: { valida: true, motivo: "Firma válida (modo demostración)." } };
  }
  throw new Error(`Ruta no simulada: ${ruta}`);
}
