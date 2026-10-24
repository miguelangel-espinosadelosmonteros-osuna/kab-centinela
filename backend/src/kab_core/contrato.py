"""Contrato de datos: el formato de una lectura de colmena.

Cada sensor (o el simulador, o los datos que genere el equipo) publica un JSON así
en el tópico MQTT  kab/colmenas/{colmena_id}/telemetria :

{
  "colmena_id": "TEK-01",            # id único de la colmena
  "apiario_id": "TEK-NOH-A",         # apiario al que pertenece
  "apiario_nombre": "Nohalal A",     # opcional
  "municipio": "Tekax",              # opcional
  "ts": "2026-10-24T15:04:05Z",      # ISO 8601 en UTC (o epoch en segundos/ms)
  "lat": 20.0960, "lon": -89.3300,   # ubicación del apiario
  "peso_kg": 42.3,                   # peso total de la colmena
  "temp_int_c": 34.8,                # temperatura dentro de la cámara de cría
  "temp_ext_c": 29.1,                # opcional: temperatura ambiente
  "humedad_pct": 62,                 # opcional: humedad relativa ambiente
  "sonido_db": 72.0,                 # nivel del zumbido
  "sonido_hz": 250,                  # frecuencia dominante del zumbido
  "bateria_pct": 88,                 # opcional
  "sesion": "demo-1"                 # opcional: separa corridas del simulador
}
"""
from __future__ import annotations

from datetime import datetime, timezone

CAMPOS_REQUERIDOS = {
    "colmena_id": str,
    "apiario_id": str,
    "ts": str,
    "lat": float,
    "lon": float,
    "peso_kg": float,
    "temp_int_c": float,
    "sonido_db": float,
    "sonido_hz": float,
}

CAMPOS_OPCIONALES = {
    "apiario_nombre": str,
    "municipio": str,
    "apicultor": str,
    "temp_ext_c": float,
    "humedad_pct": float,
    "bateria_pct": float,
    "sesion": str,
}

RANGOS = {
    "lat": (-90, 90),
    "lon": (-180, 180),
    "peso_kg": (0, 250),
    "temp_int_c": (-10, 70),
    "temp_ext_c": (-10, 60),
    "humedad_pct": (0, 100),
    "sonido_db": (0, 140),
    "sonido_hz": (0, 5000),
    "bateria_pct": (0, 100),
}


class LecturaInvalida(ValueError):
    """La lectura no cumple el contrato."""


def normalizar_ts(valor) -> str:
    """Convierte ISO 8601 o epoch (s o ms) a 'YYYY-MM-DDTHH:MM:SSZ' en UTC."""
    if isinstance(valor, (int, float)):
        segundos = valor / 1000 if valor > 1e11 else valor
        dt = datetime.fromtimestamp(segundos, tz=timezone.utc)
    elif isinstance(valor, str):
        texto = valor.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(texto)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(timezone.utc)
    else:
        raise LecturaInvalida(f"ts con formato no reconocido: {valor!r}")
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def ts_a_datetime(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def validar_lectura(datos: dict) -> dict:
    """Valida y limpia una lectura. Lanza LecturaInvalida con todos los errores juntos."""
    if not isinstance(datos, dict):
        raise LecturaInvalida("la lectura debe ser un objeto JSON")

    errores = []
    limpia = {}

    for campo, tipo in {**CAMPOS_REQUERIDOS, **CAMPOS_OPCIONALES}.items():
        valor = datos.get(campo)
        if valor is None or valor == "":
            if campo in CAMPOS_REQUERIDOS:
                errores.append(f"falta '{campo}'")
            continue
        if campo == "ts":
            try:
                limpia["ts"] = normalizar_ts(valor)
            except (ValueError, LecturaInvalida) as e:
                errores.append(f"ts inválido: {e}")
            continue
        try:
            limpia[campo] = float(valor) if tipo is float else str(valor)
        except (TypeError, ValueError):
            errores.append(f"'{campo}' debe ser {tipo.__name__}")
            continue
        if campo in RANGOS:
            minimo, maximo = RANGOS[campo]
            if not minimo <= limpia[campo] <= maximo:
                errores.append(f"'{campo}'={limpia[campo]} fuera de rango [{minimo}, {maximo}]")

    if errores:
        raise LecturaInvalida("; ".join(errores))
    return limpia
