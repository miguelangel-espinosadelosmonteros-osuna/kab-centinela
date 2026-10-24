"""Lambda de telemetría (Rol 3).

La invoca la regla de IoT Core:  SELECT * FROM 'kab/colmenas/+/telemetria'
1. valida la lectura con el contrato
2. lee el historial de la colmena en DynamoDB
3. corre las reglas de detección (y la de brote regional)
4. guarda la lectura, guarda cada alerta nueva y la publica en EventBridge
5. actualiza el estado de la colmena para el tablero
"""
from __future__ import annotations

from kab_core.contrato import LecturaInvalida, validar_lectura
from kab_core.deteccion import (
    BROTE_REGIONAL, INTOXICACION, actualizar_alertas_vigentes, detectar, detectar_brote, estado_colmena,
)

from handlers.comun import (
    actualizar_item, ahora_iso, eventos_recientes, guardar_evento, guardar_lectura, leer_historial, log,
    obtener_colmena, publicar_evento,
)


def procesar(datos: dict) -> list:
    lectura = validar_lectura(datos)
    colmena = obtener_colmena(lectura["colmena_id"])
    historial = leer_historial(lectura["colmena_id"], lectura["ts"], sesion=lectura.get("sesion"))

    alertas = detectar(lectura, historial)

    for intox in [a for a in alertas if a["tipo"] == INTOXICACION]:
        # solo eventos de la misma corrida (sesion) para no mezclar ensayos de la demo
        recientes = [e for e in eventos_recientes(tipos={INTOXICACION, BROTE_REGIONAL})
                     if e.get("sesion") == lectura.get("sesion")]
        brote = detectar_brote(
            intox,
            [e for e in recientes if e["tipo"] == INTOXICACION],
            [e for e in recientes if e["tipo"] == BROTE_REGIONAL],
        )
        if brote:
            alertas.append(brote)
        # Cada SMS a México cuesta ~0.10 USD: un SMS por apiario, y si ya hay brote, solo el del brote
        ya_avisado = any(e["tipo"] == INTOXICACION and e.get("apiario_id") == intox["apiario_id"] for e in recientes)
        intox["avisar_sms"] = not ya_avisado and not brote

    for alerta in alertas:
        alerta.setdefault("avisar_sms", alerta["severidad"] == "critica")

    vigentes, a_emitir = actualizar_alertas_vigentes(
        colmena.get("alertas_vigentes") or {}, alertas, lectura["ts"],
        colmena.get("sesion"), lectura.get("sesion"),
    )

    guardar_lectura(lectura)
    for alerta in a_emitir:
        guardar_evento(alerta)
        publicar_evento("AlertaColmena", alerta)
        log.info("ALERTA %s %s %s", alerta["tipo"], alerta["colmena_id"], alerta["mensaje"])

    ultima = {k: lectura.get(k) for k in (
        "ts", "peso_kg", "temp_int_c", "temp_ext_c", "humedad_pct", "sonido_db", "sonido_hz", "bateria_pct",
    )}
    actualizar_item("TABLA_COLMENAS", {"colmena_id": lectura["colmena_id"]}, {
        "apiario_id": lectura["apiario_id"],
        "apiario_nombre": lectura.get("apiario_nombre"),
        "municipio": lectura.get("municipio"),
        "apicultor": lectura.get("apicultor"),
        "lat": lectura["lat"],
        "lon": lectura["lon"],
        "sesion": lectura.get("sesion", ""),
        "conectada": True,
        "estado": estado_colmena(vigentes),
        "alertas_vigentes": vigentes,
        "ultima_lectura": ultima,
        "ultima_ts": lectura["ts"],
        "actualizado": ahora_iso(),
    })
    return a_emitir


def handler(event, context):
    lecturas = event.get("lecturas") if isinstance(event, dict) and "lecturas" in event else [event]
    emitidas, errores = [], []
    for datos in lecturas:
        try:
            emitidas += [a["tipo"] for a in procesar(datos)]
        except LecturaInvalida as e:
            log.warning("Lectura inválida (%s): %s", e, datos)
            errores.append(str(e))
    return {"alertas": emitidas, "errores": errores}
