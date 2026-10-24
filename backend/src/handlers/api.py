"""API HTTP del tablero (Rol 5 la consume). Una sola Lambda detrás de API Gateway.

GET  /salud                       prueba rápida
GET  /colmenas                    estado de todas las colmenas + apiarios + resumen
GET  /colmenas/{id}               detalle, últimas lecturas y alertas de una colmena
GET  /alertas                     últimas alertas (?limite=50)
GET  /expedientes                 lista de expedientes firmados
GET  /expedientes/{id}            expediente + narrativa + datos de S3 Object Lock
GET  /expedientes/{id}/verificar  verifica la copia guardada en S3
POST /verificar                   verifica cualquier sobre {documento, firma}
GET  /llave-publica               llave pública para verificar sin AWS
GET  /pasaportes                  lista de pasaportes de miel
POST /pasaportes                  crea el pasaporte de un lote {apiario_id, kg, fecha_cosecha, floracion}
GET  /pasaportes/{id}             pasaporte + verificación de la firma (lo que abre el QR)
"""
from __future__ import annotations

import base64
import json
import os

import boto3

from kab_core.deteccion import SEVERIDAD_ORDEN
from kab_core.evidencia import FirmadorKMS, firmar_documento, verificar_documento
from kab_core.pasaporte import armar_pasaporte, evaluar_lote

from handlers.comun import a_ddb, ahora_iso, de_ddb, eventos_recientes, log, tabla

_s3 = boto3.client("s3")
_firmador = None
RUTAS = {}
ORDEN_ESTADO = {"critica": 4, "alerta": 3, "atencion": 2, "sana": 1}


def firmador():
    global _firmador
    if _firmador is None:
        _firmador = FirmadorKMS(os.environ["LLAVE_KMS"])
    return _firmador


def ruta(clave):
    def registrar(fn):
        RUTAS[clave] = fn
        return fn
    return registrar


def respuesta(codigo: int, cuerpo) -> dict:
    return {
        "statusCode": codigo,
        "headers": {"content-type": "application/json; charset=utf-8"},
        "body": json.dumps(de_ddb(cuerpo), ensure_ascii=False, default=str),
    }


class ErrorApi(Exception):
    def __init__(self, codigo, mensaje):
        super().__init__(mensaje)
        self.codigo = codigo


def _scan(nombre_tabla: str) -> list:
    t, items, kwargs = tabla(nombre_tabla), [], {}
    while True:
        r = t.scan(**kwargs)
        items += r["Items"]
        if "LastEvaluatedKey" not in r:
            return de_ddb(items)
        kwargs["ExclusiveStartKey"] = r["LastEvaluatedKey"]


def _vista_colmena(c: dict) -> dict:
    vigentes = [{"tipo": k, **v} for k, v in (c.get("alertas_vigentes") or {}).items()]
    vigentes.sort(key=lambda a: -SEVERIDAD_ORDEN.get(a["severidad"], 0))
    return {
        **{k: c.get(k) for k in (
            "colmena_id", "apiario_id", "apiario_nombre", "municipio", "lat", "lon", "apicultor",
            "estado", "conectada", "ultima_lectura", "actualizado",
        )},
        "estado": c.get("estado") or "sana",
        "alertas_vigentes": vigentes,
    }


def _apiarios(colmenas: list) -> list:
    apiarios = {}
    for c in colmenas:
        a = apiarios.setdefault(c["apiario_id"], {
            "apiario_id": c["apiario_id"], "nombre": c.get("apiario_nombre") or c["apiario_id"],
            "municipio": c.get("municipio"), "lat": c.get("lat"), "lon": c.get("lon"),
            "apicultor": c.get("apicultor"), "colmenas": [], "estado": "sana",
        })
        a["colmenas"].append(c["colmena_id"])
        if ORDEN_ESTADO.get(c["estado"], 1) > ORDEN_ESTADO.get(a["estado"], 1):
            a["estado"] = c["estado"]
    return sorted(apiarios.values(), key=lambda a: a["apiario_id"])


def _documento(doc_id: str, tipo: str) -> dict:
    item = tabla("TABLA_DOCUMENTOS").get_item(Key={"doc_id": doc_id}).get("Item")
    if not item or item.get("tipo") != tipo:
        raise ErrorApi(404, f"No existe el {tipo} {doc_id}")
    item = de_ddb(item)
    item["sobre"] = json.loads(item["sobre"])
    return item


# ------------------------------------------------------------------ rutas
@ruta("GET /salud")
def salud(evento, params, cuerpo, query):
    return {"ok": True, "servicio": "kab-centinela", "hora": ahora_iso()}


@ruta("GET /colmenas")
def listar_colmenas(evento, params, cuerpo, query):
    colmenas = sorted((_vista_colmena(c) for c in _scan("TABLA_COLMENAS")), key=lambda c: c["colmena_id"])
    resumen = {"total": len(colmenas)}
    for estado in ORDEN_ESTADO:
        resumen[estado] = sum(1 for c in colmenas if c["estado"] == estado)
    resumen["desconectadas"] = sum(1 for c in colmenas if c.get("conectada") is False)
    return {"colmenas": colmenas, "apiarios": _apiarios(colmenas), "resumen": resumen}


@ruta("GET /colmenas/{id}")
def detalle_colmena(evento, params, cuerpo, query):
    from boto3.dynamodb.conditions import Key

    item = tabla("TABLA_COLMENAS").get_item(Key={"colmena_id": params["id"]}).get("Item")
    if not item:
        raise ErrorApi(404, f"No existe la colmena {params['id']}")
    limite = min(int(query.get("limite", 60)), 500)
    r = tabla("TABLA_LECTURAS").query(
        KeyConditionExpression=Key("colmena_id").eq(params["id"]), ScanIndexForward=False, Limit=limite,
    )
    lecturas = [{k: v for k, v in l.items() if k not in ("expira",)} for l in reversed(de_ddb(r["Items"]))]
    return {
        "colmena": _vista_colmena(de_ddb(item)),
        "lecturas": lecturas,
        "alertas": eventos_recientes(limite=300, colmena_id=params["id"])[:30],
    }


@ruta("GET /alertas")
def listar_alertas(evento, params, cuerpo, query):
    limite = min(int(query.get("limite", 50)), 300)
    return {"alertas": eventos_recientes(limite=limite)}


@ruta("GET /expedientes")
def listar_expedientes(evento, params, cuerpo, query):
    docs = [d for d in _scan("TABLA_DOCUMENTOS") if d.get("tipo") == "expediente"]
    docs.sort(key=lambda d: d.get("creado", ""), reverse=True)
    campos = ("doc_id", "creado", "colmena_id", "apiario_id", "tipo_alerta", "resumen", "narrativa_fuente",
              "retencion_modo", "retencion_hasta")
    return {"expedientes": [{k: d.get(k) for k in campos} for d in docs]}


@ruta("GET /expedientes/{id}")
def ver_expediente(evento, params, cuerpo, query):
    d = _documento(params["id"], "expediente")
    return {"expediente": {
        "doc_id": d["doc_id"], "creado": d.get("creado"), "sobre": d["sobre"],
        "narrativa": d.get("narrativa"), "narrativa_fuente": d.get("narrativa_fuente"),
        "s3": {
            "bucket": d.get("s3_bucket"), "key": d.get("s3_key"), "version_id": d.get("s3_version"),
            "retencion_modo": d.get("retencion_modo"), "retencion_hasta": d.get("retencion_hasta"),
        },
    }}


@ruta("GET /expedientes/{id}/verificar")
def verificar_expediente_s3(evento, params, cuerpo, query):
    d = _documento(params["id"], "expediente")
    kwargs = {"Bucket": d["s3_bucket"], "Key": d["s3_key"]}
    if d.get("s3_version"):
        kwargs["VersionId"] = d["s3_version"]
    guardado = json.loads(_s3.get_object(**kwargs)["Body"].read())
    resultado = verificar_documento(guardado, firmador())
    resultado["fuente"] = f"s3://{d['s3_bucket']}/{d['s3_key']} (Object Lock {d.get('retencion_modo')})"
    return {"verificacion": resultado}


@ruta("POST /verificar")
def verificar(evento, params, cuerpo, query):
    sobre = cuerpo.get("sobre", cuerpo)
    return {"verificacion": verificar_documento(sobre, firmador())}


@ruta("GET /llave-publica")
def llave_publica(evento, params, cuerpo, query):
    return {"algoritmo": "ECDSA_SHA_256 (P-256)", "pem": firmador().llave_publica_pem()}


@ruta("GET /pasaportes")
def listar_pasaportes(evento, params, cuerpo, query):
    docs = [d for d in _scan("TABLA_DOCUMENTOS") if d.get("tipo") == "pasaporte"]
    docs.sort(key=lambda d: d.get("creado", ""), reverse=True)
    return {"pasaportes": [{k: d.get(k) for k in ("doc_id", "creado", "apiario_id", "dictamen")} for d in docs]}


@ruta("POST /pasaportes")
def crear_pasaporte(evento, params, cuerpo, query):
    apiario_id = cuerpo.get("apiario_id")
    if not apiario_id:
        raise ErrorApi(400, "Falta apiario_id")
    colmenas = [c for c in _scan("TABLA_COLMENAS") if c.get("apiario_id") == apiario_id]
    if not colmenas:
        raise ErrorApi(404, f"No hay colmenas en el apiario {apiario_id}")
    apiario = _apiarios([_vista_colmena(c) for c in colmenas])[0]

    ahora = ahora_iso()
    evaluacion = evaluar_lote(apiario, eventos_recientes(limite=1000), ahora)
    lote = {"kg": cuerpo.get("kg"), "fecha_cosecha": cuerpo.get("fecha_cosecha"), "floracion": cuerpo.get("floracion")}
    documento = armar_pasaporte(lote, apiario, apiario["colmenas"], evaluacion, ahora)
    sobre = firmar_documento(documento, firmador())

    pid = documento["pasaporte_id"]
    bucket = os.environ["BUCKET_EVIDENCIA"]
    llave_s3 = f"pasaportes/{pid}.json"
    put = _s3.put_object(Bucket=bucket, Key=llave_s3, ContentType="application/json", ChecksumAlgorithm="SHA256",
                         Body=json.dumps(sobre, ensure_ascii=False, indent=2).encode("utf-8"))
    tabla("TABLA_DOCUMENTOS").put_item(Item=a_ddb({
        "doc_id": pid, "tipo": "pasaporte", "creado": ahora, "apiario_id": apiario_id,
        "dictamen": documento["dictamen"], "sobre": json.dumps(sobre, ensure_ascii=False),
        "s3_bucket": bucket, "s3_key": llave_s3, "s3_version": put.get("VersionId"),
    }))
    base = os.environ.get("URL_TABLERO", "").rstrip("/")
    return {"pasaporte_id": pid, "dictamen": documento["dictamen"], "sobre": sobre,
            "url": f"{base}/pasaporte/{pid}" if base else None}


@ruta("GET /pasaportes/{id}")
def ver_pasaporte(evento, params, cuerpo, query):
    d = _documento(params["id"], "pasaporte")
    return {
        "pasaporte": {"doc_id": d["doc_id"], "creado": d.get("creado"), "sobre": d["sobre"]},
        "verificacion": verificar_documento(d["sobre"], firmador()),
    }


# ---------------------------------------------------------------- entrada
def handler(event, context):
    clave = event.get("routeKey", "")
    fn = RUTAS.get(clave)
    if not fn:
        return respuesta(404, {"error": f"Ruta no encontrada: {clave}"})
    try:
        cuerpo = event.get("body") or ""
        if cuerpo and event.get("isBase64Encoded"):
            cuerpo = base64.b64decode(cuerpo).decode("utf-8")
        cuerpo = json.loads(cuerpo) if cuerpo else {}
        return respuesta(200, fn(event, event.get("pathParameters") or {}, cuerpo,
                                 event.get("queryStringParameters") or {}))
    except ErrorApi as e:
        return respuesta(e.codigo, {"error": str(e)})
    except (json.JSONDecodeError, ValueError) as e:
        return respuesta(400, {"error": f"Petición inválida: {e}"})
    except Exception:
        log.exception("Error en %s", clave)
        return respuesta(500, {"error": "Error interno"})
