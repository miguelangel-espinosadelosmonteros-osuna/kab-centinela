"""Lambda de avisos (Rol 3).

EventBridge le manda cada alerta (y cada expediente firmado). Arma un texto corto
para SMS y uno largo para correo, y publica en el tópico de Amazon SNS.

El correo recibe todo. La suscripción SMS tiene un filtro (atributo sms = "si"):
solo llegan las alertas críticas marcadas con avisar_sms, porque cada SMS a México
cuesta ~0.10 USD y el límite de gasto inicial de la cuenta es de 1 USD al mes.
Para ensayar sin gastar SMS: variable de entorno SMS_ACTIVO=no en esta Lambda.
"""
from __future__ import annotations

import json
import os
import unicodedata

import boto3

from handlers.comun import log

_sns = boto3.client("sns")


def sin_acentos(texto: str) -> str:
    """SMS sin acentos = 160 caracteres por mensaje (con acentos son 70)."""
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()


def _link(ruta: str) -> str:
    base = os.environ.get("URL_TABLERO", "").rstrip("/")
    return f"{base}{ruta}" if base else ""


def mensajes_alerta(a: dict):
    lugar = a.get("apiario_nombre") or a.get("apiario_id") or ""
    if a.get("municipio"):
        lugar += f" ({a['municipio']})"
    link = _link(f"/colmenas/{a['colmena_id']}")
    asunto = f"Kaab [{a['severidad'].upper()}] {a['titulo']} - {a['colmena_id']}"
    corto = f"Kaab: {a['titulo']} en {a['colmena_id']} {lugar}. {a['mensaje']} {link}".strip()
    largo = "\n".join(filter(None, [
        f"{a['titulo']} ({a['severidad']})",
        f"Colmena: {a['colmena_id']} · Apiario: {lugar}",
        f"Detectada: {a['ts']} (UTC)",
        "",
        a["mensaje"],
        "",
        f"Qué hacer: {a['recomendacion']}",
        f"Ver en el tablero: {link}" if link else None,
    ]))
    return asunto, corto, largo, a["severidad"], a["tipo"]


def mensajes_expediente(d: dict):
    link = _link(f"/expedientes/{d['expediente_id']}")
    asunto = f"Kaab: expediente firmado {d['expediente_id']}"
    corto = f"Kaab: expediente firmado {d['expediente_id']} listo para denuncia. {link}".strip()
    largo = "\n".join(filter(None, [
        f"Se generó el expediente {d['expediente_id']} para la colmena {d.get('colmena_id')}.",
        f"Firmado con AWS KMS ({d.get('algoritmo')}), guardado en S3 con Object Lock "
        f"({d.get('retencion_modo')}) hasta {d.get('retencion_hasta')}.",
        f"Narrativa: {d.get('narrativa_fuente')}",
        f"Consultar y verificar: {link}" if link else None,
    ]))
    return asunto, corto, largo, "info", "EXPEDIENTE"


def handler(event, context):
    detalle = event.get("detail", {})
    if event.get("detail-type") == "ExpedienteFirmado":
        asunto, corto, largo, severidad, tipo = mensajes_expediente(detalle)
    else:
        asunto, corto, largo, severidad, tipo = mensajes_alerta(detalle)
    sms = "si" if detalle.get("avisar_sms") and os.environ.get("SMS_ACTIVO", "si") == "si" else "no"

    _sns.publish(
        TopicArn=os.environ["TOPIC_ALERTAS"],
        Subject=sin_acentos(asunto)[:99],
        MessageStructure="json",
        Message=json.dumps({"default": largo, "email": largo, "sms": sin_acentos(corto)[:300]}),
        MessageAttributes={
            "severidad": {"DataType": "String", "StringValue": severidad},
            "tipo": {"DataType": "String", "StringValue": tipo},
            "sms": {"DataType": "String", "StringValue": sms},
        },
    )
    log.info("Aviso enviado (sms=%s): %s", sms, asunto)
    return {"ok": True}
