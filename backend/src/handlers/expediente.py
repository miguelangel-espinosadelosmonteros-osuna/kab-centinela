"""Lambda de expediente (Rol 4).

EventBridge la invoca SOLO para INTOXICACION y BROTE_REGIONAL.
1. junta las lecturas del sensor y los eventos relacionados
2. arma el JSON del expediente y lo firma con AWS KMS (ECDSA P-256)
3. Amazon Bedrock redacta la narrativa en español a partir del JSON firmado
4. lo guarda en S3 con Object Lock: nadie lo puede borrar ni cambiar
5. lo registra en DynamoDB y publica "ExpedienteFirmado"
"""
from __future__ import annotations

import json
import os

import boto3

from kab_core.contrato import ts_a_datetime
from kab_core.evidencia import FirmadorKMS, armar_expediente, firmar_documento
from kab_core.narrativa import redactar_narrativa

from handlers.comun import (
    a_ddb, ahora_iso, eventos_recientes, leer_historial, log, obtener_colmena, publicar_evento, tabla,
)

_s3 = boto3.client("s3")
VENTANA_LECTURAS_MIN = 180


def _relacionadas(alerta: dict) -> list:
    ids = set(alerta.get("metricas", {}).get("eventos_relacionados") or [])
    t = ts_a_datetime(alerta["ts"])
    salida = []
    for e in eventos_recientes(tipos={"INTOXICACION", "BROTE_REGIONAL"}):
        if e["alerta_id"] == alerta["alerta_id"]:
            continue
        cerca_en_tiempo = abs((t - ts_a_datetime(e["ts"])).total_seconds()) <= 6 * 3600
        if e["alerta_id"] in ids or (cerca_en_tiempo and e.get("apiario_id") == alerta.get("apiario_id")):
            salida.append(e)
    return salida


def handler(event, context):
    alerta = event["detail"]
    colmena = obtener_colmena(alerta["colmena_id"])
    t = ts_a_datetime(alerta["ts"])
    lecturas = [
        l for l in leer_historial(alerta["colmena_id"], alerta["ts"], sesion=alerta.get("sesion"), incluir_ts=True)
        if (t - ts_a_datetime(l["ts"])).total_seconds() <= VENTANA_LECTURAS_MIN * 60
    ]

    expediente = armar_expediente(alerta, lecturas, colmena, _relacionadas(alerta), ahora_iso())
    sobre = firmar_documento(expediente, FirmadorKMS(os.environ["LLAVE_KMS"]))
    narrativa, fuente = redactar_narrativa(expediente, os.environ.get("BEDROCK_MODEL_ID"), os.environ["AWS_REGION"])

    expediente_id = expediente["expediente_id"]
    bucket = os.environ["BUCKET_EVIDENCIA"]
    llave_s3 = f"expedientes/{alerta['ts'][:10]}/{expediente_id}.json"
    cuerpo = {
        **sobre,
        "narrativa": {"texto": narrativa, "fuente": fuente, "nota": "La narrativa no forma parte de lo firmado."},
    }
    put = _s3.put_object(
        Bucket=bucket, Key=llave_s3, ContentType="application/json", ChecksumAlgorithm="SHA256",
        Body=json.dumps(cuerpo, ensure_ascii=False, indent=2).encode("utf-8"),
    )
    version = put.get("VersionId")
    retencion = _s3.get_object_retention(Bucket=bucket, Key=llave_s3, VersionId=version).get("Retention", {})

    tabla("TABLA_DOCUMENTOS").put_item(Item=a_ddb({
        "doc_id": expediente_id,
        "tipo": "expediente",
        "creado": expediente["generado_en"],
        "colmena_id": alerta["colmena_id"],
        "apiario_id": alerta.get("apiario_id"),
        "tipo_alerta": alerta["tipo"],
        "resumen": alerta["mensaje"],
        "sobre": json.dumps(sobre, ensure_ascii=False),
        "narrativa": narrativa,
        "narrativa_fuente": fuente,
        "s3_bucket": bucket,
        "s3_key": llave_s3,
        "s3_version": version,
        "retencion_modo": retencion.get("Mode"),
        "retencion_hasta": str(retencion.get("RetainUntilDate", "")),
    }))

    publicar_evento("ExpedienteFirmado", {
        "expediente_id": expediente_id,
        "colmena_id": alerta["colmena_id"],
        "algoritmo": sobre["firma"]["algoritmo"],
        "s3_key": llave_s3,
        "retencion_modo": retencion.get("Mode"),
        "retencion_hasta": str(retencion.get("RetainUntilDate", "")),
        "narrativa_fuente": fuente,
    })
    log.info("Expediente %s firmado y guardado en s3://%s/%s", expediente_id, bucket, llave_s3)
    return {"expediente_id": expediente_id, "s3_key": llave_s3}
