"""Lambda de conexión (Rol 2).

Cada sensor se conecta a IoT Core con un "Last Will and Testament": un mensaje que
IoT Core publica SOLO si el sensor se cae de golpe (sin despedirse). La regla
SELECT * FROM 'kab/colmenas/+/estado'  invoca esta Lambda.

  {"colmena_id": "TEK-01", "estado": "desconectada"}   <- Last Will
  {"colmena_id": "TEK-01", "estado": "conectada"}      <- al conectarse
"""
from __future__ import annotations

from kab_core.deteccion import DESCONEXION, actualizar_alertas_vigentes, estado_colmena, nueva_alerta

from handlers.comun import actualizar_item, ahora_iso, guardar_evento, log, obtener_colmena, publicar_evento


def handler(event, context):
    colmena_id = event.get("colmena_id")
    estado = event.get("estado")
    if not colmena_id or estado not in ("conectada", "desconectada"):
        log.warning("Mensaje de estado inválido: %s", event)
        return {"ok": False}

    colmena = obtener_colmena(colmena_id)
    vigentes = colmena.get("alertas_vigentes") or {}
    # Usamos el reloj de las lecturas para que convivan con las alertas vigentes
    ts = colmena.get("ultima_ts") or ahora_iso()

    if estado == "desconectada":
        origen = {
            "colmena_id": colmena_id, "ts": ts,
            **{k: colmena.get(k) for k in ("apiario_id", "apiario_nombre", "municipio", "lat", "lon", "sesion")},
        }
        alerta = nueva_alerta(DESCONEXION, origen, "El sensor dejó de transmitir sin despedirse (Last Will).", {})
        vigentes, a_emitir = actualizar_alertas_vigentes(vigentes, [alerta], ts)
        for a in a_emitir:
            guardar_evento(a)
            publicar_evento("AlertaColmena", a)
        conectada = False
    else:
        vigentes = {k: v for k, v in vigentes.items() if k != DESCONEXION}
        conectada = True

    actualizar_item("TABLA_COLMENAS", {"colmena_id": colmena_id}, {
        "conectada": conectada,
        "estado": estado_colmena(vigentes),
        "alertas_vigentes": vigentes,
        "actualizado": ahora_iso(),
    })
    log.info("Colmena %s %s", colmena_id, estado)
    return {"ok": True, "conectada": conectada}
