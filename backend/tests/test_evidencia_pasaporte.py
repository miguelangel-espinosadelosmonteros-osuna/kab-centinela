import copy

import pytest
from conftest import lectura

from kab_core.contrato import LecturaInvalida, normalizar_ts, validar_lectura
from kab_core.deteccion import detectar
from kab_core.evidencia import armar_expediente, firmar_documento, json_canonico, verificar_documento
from kab_core.narrativa import plantilla_respaldo, redactar_narrativa
from kab_core.pasaporte import armar_pasaporte, evaluar_lote


@pytest.fixture
def expediente(sana):
    alerta = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)[0]
    return armar_expediente(alerta, sana, {"apicultor": "Cooperativa demo"}, [], "2026-10-24T14:00:00Z")


def test_json_canonico_no_depende_del_orden():
    assert json_canonico({"b": 1, "a": "á"}) == json_canonico({"a": "á", "b": 1})


def test_firma_valida_y_alteracion_detectada(expediente, firmador):
    sobre = firmar_documento(expediente, firmador)
    assert verificar_documento(sobre, firmador)["valida"] is True

    alterado = copy.deepcopy(sobre)
    alterado["documento"]["alerta"]["metricas"]["caida_sonido_db"] = 1.0
    resultado = verificar_documento(alterado, firmador)
    assert resultado["valida"] is False
    assert "alterado" in resultado["motivo"]


def test_sobre_mal_formado(firmador):
    assert verificar_documento({"x": 1}, firmador)["valida"] is False


def test_narrativa_usa_plantilla_si_no_hay_modelo(expediente):
    texto, fuente = redactar_narrativa(expediente, "", "us-east-1")
    assert fuente == "plantilla"
    assert expediente["expediente_id"] in texto
    assert texto == plantilla_respaldo(expediente)


def test_pasaporte_apto_y_no_apto(sana):
    intox = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)[0]
    tekax = {"apiario_id": "TEK-NOH-A", "lat": 20.096, "lon": -89.33}
    peto = {"apiario_id": "PETO-01", "lat": 20.1256, "lon": -88.9217}
    ahora = "2026-10-25T12:00:00Z"
    assert evaluar_lote(tekax, [intox], ahora)["dictamen"] == "NO APTO"
    vecino = {"apiario_id": "TEK-NOH-B", "lat": 20.105, "lon": -89.32}
    assert evaluar_lote(vecino, [intox], ahora)["apto"] is False  # a menos de 3 km
    ev = evaluar_lote(peto, [intox], ahora)
    assert ev["apto"] is True
    doc = armar_pasaporte({"kg": 300}, {**peto, "nombre": "Peto"}, ["PET-01"], ev, ahora)
    assert doc["denominacion_origen"]["elegible"] is True


def test_contrato_valida_y_normaliza():
    limpia = validar_lectura({**lectura(0), "ts": "2026-10-24T06:00:00-06:00", "peso_kg": "42.5"})
    assert limpia["ts"] == "2026-10-24T12:00:00Z" and limpia["peso_kg"] == 42.5
    assert normalizar_ts(1761307200000) == normalizar_ts(1761307200)
    with pytest.raises(LecturaInvalida):
        validar_lectura({"colmena_id": "X"})
    with pytest.raises(LecturaInvalida):
        validar_lectura({**lectura(0), "humedad_pct": 140})
