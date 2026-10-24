import os
import sys
from datetime import datetime, timedelta, timezone

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

INICIO = datetime(2026, 10, 24, 12, 0, tzinfo=timezone.utc)

BASE = {
    "colmena_id": "TEK-01",
    "apiario_id": "TEK-NOH-A",
    "apiario_nombre": "Nohalal A",
    "municipio": "Tekax",
    "lat": 20.0960,
    "lon": -89.3300,
    "peso_kg": 42.0,
    "temp_int_c": 34.8,
    "temp_ext_c": 29.0,
    "humedad_pct": 65.0,
    "sonido_db": 72.0,
    "sonido_hz": 250.0,
    "bateria_pct": 90.0,
}


def lectura(minuto: float, **cambios) -> dict:
    ts = (INICIO + timedelta(minutes=minuto)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {**BASE, "ts": ts, **cambios}


@pytest.fixture
def sana():
    """12 lecturas sanas, una cada 10 min (2 horas)."""
    return [lectura(i * 10) for i in range(12)]


class FirmadorFalso:
    """Firma con HMAC para probar sin AWS. Se comporta igual: si cambia el hash, falla."""

    key_id = "llave-de-prueba"

    def firmar(self, digest):
        import hashlib
        import hmac

        return hmac.new(b"secreto", digest, hashlib.sha256).digest()

    def verificar(self, digest, firma):
        import hmac

        return hmac.compare_digest(self.firmar(digest), firma)


@pytest.fixture
def firmador():
    return FirmadorFalso()
