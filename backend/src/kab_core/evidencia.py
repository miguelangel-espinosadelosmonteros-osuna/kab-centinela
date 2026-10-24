"""Expediente de intoxicación y firma digital (Rol 4).

Cómo funciona la firma:
  1. El documento se convierte a JSON canónico (llaves ordenadas, sin espacios),
     así el mismo contenido siempre produce los mismos bytes.
  2. Se calcula su SHA-256.
  3. AWS KMS firma ese hash con una llave ECDSA P-256. La llave privada nunca
     sale de KMS: nadie del equipo la puede copiar.
  4. Para verificar, cualquiera recalcula el hash y KMS (o la llave pública)
     confirma la firma. Si se cambia UN solo dato, el hash cambia y la firma falla.
"""
from __future__ import annotations

import base64
import hashlib
import json

ALGORITMO = "ECDSA_SHA_256"

AUTORIDADES_SUGERIDAS = [
    "PROFEPA (Procuraduría Federal de Protección al Ambiente)",
    "SENASICA / SADER (sanidad e inocuidad agroalimentaria)",
    "Secretaría de Desarrollo Sustentable de Yucatán",
    "Fiscalía General de la República (delitos ambientales)",
]


def json_canonico(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str).encode("utf-8")


def digest_sha256(obj) -> bytes:
    return hashlib.sha256(json_canonico(obj)).digest()


class FirmadorKMS:
    """Firma y verifica con una llave asimétrica de AWS KMS."""

    def __init__(self, key_id: str, cliente=None):
        import boto3  # solo se necesita en AWS

        self.key_id = key_id
        self.kms = cliente or boto3.client("kms")

    def firmar(self, digest: bytes) -> bytes:
        r = self.kms.sign(KeyId=self.key_id, Message=digest, MessageType="DIGEST", SigningAlgorithm=ALGORITMO)
        return r["Signature"]

    def verificar(self, digest: bytes, firma: bytes) -> bool:
        try:
            r = self.kms.verify(
                KeyId=self.key_id, Message=digest, MessageType="DIGEST",
                Signature=firma, SigningAlgorithm=ALGORITMO,
            )
            return bool(r["SignatureValid"])
        except self.kms.exceptions.KMSInvalidSignatureException:
            return False

    def llave_publica_pem(self) -> str:
        der = self.kms.get_public_key(KeyId=self.key_id)["PublicKey"]
        b64 = base64.b64encode(der).decode()
        lineas = [b64[i:i + 64] for i in range(0, len(b64), 64)]
        return "-----BEGIN PUBLIC KEY-----\n" + "\n".join(lineas) + "\n-----END PUBLIC KEY-----\n"


def firmar_documento(documento: dict, firmador) -> dict:
    """Devuelve el 'sobre': el documento intacto + su firma."""
    digest = digest_sha256(documento)
    firma = firmador.firmar(digest)
    return {
        "documento": documento,
        "firma": {
            "algoritmo": ALGORITMO,
            "llave": getattr(firmador, "key_id", "local"),
            "digest_sha256": digest.hex(),
            "valor_b64": base64.b64encode(firma).decode(),
        },
    }


def verificar_documento(sobre: dict, firmador) -> dict:
    """Recalcula el hash del documento recibido y le pide a KMS validar la firma."""
    try:
        documento = sobre["documento"]
        firma = base64.b64decode(sobre["firma"]["valor_b64"])
    except (KeyError, TypeError, ValueError):
        return {"valida": False, "motivo": "El sobre no trae 'documento' y 'firma.valor_b64'."}

    digest = digest_sha256(documento)
    valida = firmador.verificar(digest, firma)
    firmado = sobre["firma"].get("digest_sha256")
    if valida:
        motivo = "La firma es válida: el documento no ha cambiado desde que se firmó."
    elif firmado and firmado != digest.hex():
        motivo = "La firma NO es válida: el documento fue alterado después de firmarse."
    else:
        motivo = "La firma NO es válida."
    return {
        "valida": valida,
        "algoritmo": ALGORITMO,
        "digest_calculado": digest.hex(),
        "digest_firmado": firmado,
        "motivo": motivo,
    }


def armar_expediente(alerta: dict, lecturas: list, colmena: dict, relacionadas: list, generado_en: str) -> dict:
    """Arma el JSON del expediente. ESTE JSON es la evidencia (lo que se firma)."""
    fecha = alerta["ts"][:10].replace("-", "")
    expediente_id = f"EXP-{fecha}-{alerta['colmena_id']}-{alerta['alerta_id'][-6:]}"
    lecturas = sorted(lecturas, key=lambda l: l["ts"])
    return {
        "tipo_documento": "EXPEDIENTE_INTOXICACION",
        "version": 1,
        "expediente_id": expediente_id,
        "generado_en": generado_en,
        "alerta": {
            "alerta_id": alerta["alerta_id"],
            "tipo": alerta["tipo"],
            "severidad": alerta["severidad"],
            "detectada_en": alerta["ts"],
            "descripcion": alerta["mensaje"],
            "metricas": alerta.get("metricas", {}),
        },
        "ubicacion": {
            "colmena_id": alerta["colmena_id"],
            "apiario_id": alerta.get("apiario_id"),
            "apiario_nombre": alerta.get("apiario_nombre") or colmena.get("apiario_nombre"),
            "municipio": alerta.get("municipio") or colmena.get("municipio"),
            "estado": "Yucatán",
            "lat": alerta.get("lat"),
            "lon": alerta.get("lon"),
        },
        "apicultor": colmena.get("apicultor"),
        "lecturas_sensor": [
            {k: l.get(k) for k in ("ts", "peso_kg", "temp_int_c", "temp_ext_c", "humedad_pct", "sonido_db", "sonido_hz")}
            for l in lecturas
        ],
        "eventos_relacionados": [
            {k: e.get(k) for k in ("alerta_id", "tipo", "colmena_id", "apiario_id", "ts", "mensaje")}
            for e in relacionadas
        ],
        "autoridades_sugeridas": AUTORIDADES_SUGERIDAS,
        "aviso": "Documento generado automáticamente por sensores; la evidencia es este JSON firmado.",
    }
