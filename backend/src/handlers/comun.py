"""Utilidades compartidas por las Lambdas: DynamoDB, EventBridge y fechas."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

log = logging.getLogger()
log.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

FUENTE_EVENTOS = "kab.centinela"
TTL_LECTURAS_DIAS = 30

_ddb = boto3.resource("dynamodb")
_events = boto3.client("events")


def tabla(variable_entorno: str):
    return _ddb.Table(os.environ[variable_entorno])


def ahora_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def a_ddb(obj):
    """float -> Decimal (DynamoDB no acepta float)."""
    return json.loads(json.dumps(obj, default=str), parse_float=Decimal)


def de_ddb(obj):
    """Decimal -> int/float para poder regresar JSON."""
    if isinstance(obj, list):
        return [de_ddb(x) for x in obj]
    if isinstance(obj, dict):
        return {k: de_ddb(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return int(obj) if obj == obj.to_integral_value() else float(obj)
    return obj


def actualizar_item(nombre_tabla: str, llave: dict, campos: dict, quitar=()):
    """UPDATE parcial: solo cambia los campos dados (los None se ignoran)."""
    campos = {k: v for k, v in campos.items() if v is not None}
    nombres, valores, sets = {}, {}, []
    for i, (k, v) in enumerate(campos.items()):
        nombres[f"#c{i}"] = k
        valores[f":v{i}"] = v
        sets.append(f"#c{i} = :v{i}")
    expresion = "SET " + ", ".join(sets)
    if quitar:
        for j, k in enumerate(quitar):
            nombres[f"#q{j}"] = k
        expresion += " REMOVE " + ", ".join(f"#q{j}" for j in range(len(quitar)))
    tabla(nombre_tabla).update_item(
        Key=llave,
        UpdateExpression=expresion,
        ExpressionAttributeNames=nombres,
        ExpressionAttributeValues=a_ddb(valores),
    )


def obtener_colmena(colmena_id: str) -> dict:
    r = tabla("TABLA_COLMENAS").get_item(Key={"colmena_id": colmena_id})
    return de_ddb(r.get("Item") or {})


def leer_historial(colmena_id: str, ts: str, sesion=None, incluir_ts=False, limite=500) -> list:
    """Lecturas anteriores de la colmena (de la más vieja a la más nueva)."""
    condicion = Key("colmena_id").eq(colmena_id) & (Key("ts").lte(ts) if incluir_ts else Key("ts").lt(ts))
    r = tabla("TABLA_LECTURAS").query(KeyConditionExpression=condicion, ScanIndexForward=False, Limit=limite)
    items = de_ddb(r["Items"])
    if sesion:
        items = [i for i in items if i.get("sesion") == sesion]
    return list(reversed(items))


def guardar_lectura(lectura: dict):
    expira = int(datetime.now(timezone.utc).timestamp()) + TTL_LECTURAS_DIAS * 86400
    tabla("TABLA_LECTURAS").put_item(Item=a_ddb({**lectura, "expira": expira, "recibido": ahora_iso()}))


def guardar_evento(alerta: dict):
    item = {"pk": "ALERTA", "sk": f"{alerta['ts']}#{alerta['alerta_id']}", **alerta, "recibido": ahora_iso()}
    tabla("TABLA_EVENTOS").put_item(Item=a_ddb(item))


def eventos_recientes(limite=300, tipos=None, colmena_id=None) -> list:
    r = tabla("TABLA_EVENTOS").query(
        KeyConditionExpression=Key("pk").eq("ALERTA"), ScanIndexForward=False, Limit=limite,
    )
    items = de_ddb(r["Items"])
    if tipos:
        items = [i for i in items if i.get("tipo") in tipos]
    if colmena_id:
        items = [i for i in items if i.get("colmena_id") == colmena_id]
    for i in items:
        i.pop("pk", None)
        i.pop("sk", None)
    return items


def publicar_evento(tipo_detalle: str, detalle: dict):
    r = _events.put_events(Entries=[{
        "Source": FUENTE_EVENTOS,
        "DetailType": tipo_detalle,
        "Detail": json.dumps(detalle, default=str, ensure_ascii=False),
        "EventBusName": os.environ["BUS_EVENTOS"],
    }])
    if r.get("FailedEntryCount"):
        log.error("EventBridge rechazó el evento: %s", r["Entries"])
