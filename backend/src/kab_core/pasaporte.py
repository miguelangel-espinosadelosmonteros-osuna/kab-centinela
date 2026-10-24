"""Pasaporte del lote de miel (Rol 4).

El pasaporte dice de dónde viene la miel y si el apiario estuvo libre de
intoxicaciones durante la temporada. Se firma con KMS igual que el expediente,
y el comprador lo verifica escaneando el QR.

Sirve para cobrar mejor: un comprador paga más si puede comprobar el origen y que
la miel no viene de un apiario fumigado.
"""
from __future__ import annotations

import hashlib

from .contrato import ts_a_datetime
from .geo import distancia_km

TIPOS_QUE_DESCALIFICAN = {"INTOXICACION", "BROTE_REGIONAL"}
VENTANA_DIAS = 60
RADIO_KM = 3.0


def evaluar_lote(apiario: dict, eventos: list, ahora: str, ventana_dias: int = VENTANA_DIAS) -> dict:
    """El lote NO es apto si hubo intoxicación en el apiario o a menos de 3 km."""
    t = ts_a_datetime(ahora)
    motivos, relevantes = [], []
    for e in eventos:
        if e.get("tipo") not in TIPOS_QUE_DESCALIFICAN:
            continue
        dias = (t - ts_a_datetime(e["ts"])).total_seconds() / 86400
        if dias > ventana_dias or dias < -1:
            continue
        mismo = e.get("apiario_id") == apiario["apiario_id"] or apiario["apiario_id"] in (
            e.get("metricas", {}).get("apiarios") or []
        )
        cerca = None
        if not mismo and e.get("lat") is not None and apiario.get("lat") is not None:
            cerca = distancia_km(apiario["lat"], apiario["lon"], e["lat"], e["lon"])
        if mismo or (cerca is not None and cerca <= RADIO_KM):
            donde = "en el apiario" if mismo else f"a {cerca:.1f} km"
            motivos.append(f"{e['tipo']} {donde} el {e['ts'][:10]} ({e.get('colmena_id')})")
            relevantes.append(e.get("alerta_id"))
    apto = not motivos
    return {
        "apto": apto,
        "dictamen": "APTO" if apto else "NO APTO",
        "motivos": motivos or [f"Sin intoxicaciones registradas en {ventana_dias} días ni a {RADIO_KM:.0f} km."],
        "eventos_relevantes": sorted(set(filter(None, relevantes))),
    }


def armar_pasaporte(lote: dict, apiario: dict, colmenas: list, evaluacion: dict, generado_en: str) -> dict:
    huella = f"{apiario['apiario_id']}|{lote.get('fecha_cosecha')}|{generado_en}".encode()
    pasaporte_id = "PAS-" + hashlib.sha1(huella).hexdigest()[:10].upper()
    return {
        "tipo_documento": "PASAPORTE_MIEL",
        "version": 1,
        "pasaporte_id": pasaporte_id,
        "generado_en": generado_en,
        "lote": {
            "kg": lote.get("kg"),
            "fecha_cosecha": lote.get("fecha_cosecha"),
            "floracion": lote.get("floracion"),
            "colmenas": sorted(colmenas),
        },
        "origen": {
            "apiario_id": apiario["apiario_id"],
            "apiario_nombre": apiario.get("nombre"),
            "municipio": apiario.get("municipio"),
            "estado": "Yucatán",
            "region": "Península de Yucatán",
            "lat": apiario.get("lat"),
            "lon": apiario.get("lon"),
            "apicultor": apiario.get("apicultor"),
        },
        "dictamen": evaluacion["dictamen"],
        "apto": evaluacion["apto"],
        "motivos": evaluacion["motivos"],
        "eventos_relevantes": evaluacion["eventos_relevantes"],
        "denominacion_origen": {
            "nombre": "Miel de la Península de Yucatán",
            "elegible": evaluacion["apto"],
            "nota": "Evidencia de origen y sanidad del apiario para trámites de denominación de origen; "
                    "la certificación la otorga el organismo regulador.",
        },
    }
