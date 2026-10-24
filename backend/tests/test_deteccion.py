from conftest import lectura

from kab_core.deteccion import (
    AUSENCIA_REINA, BROTE_REGIONAL, ENJAMBRAZON, FRIO, GOLPE_CALOR, HAMBRUNA, INTOXICACION, SEQUIA, VARROA,
    actualizar_alertas_vigentes, detectar, detectar_brote, estado_colmena,
)


def tipos(alertas):
    return {a["tipo"] for a in alertas}


def test_colmena_sana_no_alerta(sana):
    assert detectar(lectura(120), sana) == []


def test_intoxicacion_cae_sonido_y_peso(sana):
    alertas = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)
    assert tipos(alertas) == {INTOXICACION}
    assert alertas[0]["severidad"] == "critica"
    assert alertas[0]["metricas"]["caida_sonido_db"] == 14.0


def test_noche_fresca_no_es_intoxicacion(sana):
    # el zumbido baja de noche, pero el peso se mantiene
    alertas = detectar(lectura(120, sonido_db=58.0, peso_kg=41.9, temp_ext_c=20.0), sana)
    assert INTOXICACION not in tipos(alertas)


def test_sin_historial_no_hay_intoxicacion():
    assert detectar(lectura(0, sonido_db=40.0, peso_kg=30.0), []) == []


def test_brote_regional_dos_apiarios_cercanos(sana):
    a = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)[0]
    vecino = {**a, "alerta_id": "ALR-vecino", "colmena_id": "TEK-04", "apiario_id": "TEK-NOH-B",
              "lat": 20.1050, "lon": -89.3200}
    brote = detectar_brote(a, [vecino])
    assert brote["tipo"] == BROTE_REGIONAL
    assert brote["metricas"]["apiarios"] == ["TEK-NOH-A", "TEK-NOH-B"]
    assert brote["metricas"]["distancia_max_km"] < 3


def test_no_hay_brote_si_el_vecino_esta_lejos(sana):
    a = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)[0]
    peto = {**a, "alerta_id": "ALR-peto", "apiario_id": "PETO-01", "lat": 20.1256, "lon": -88.9217}
    assert detectar_brote(a, [peto]) is None


def test_no_hay_brote_en_el_mismo_apiario(sana):
    a = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)[0]
    misma = {**a, "alerta_id": "ALR-2", "colmena_id": "TEK-02"}
    assert detectar_brote(a, [misma]) is None


def test_brote_no_se_repite(sana):
    a = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)[0]
    vecino = {**a, "alerta_id": "ALR-v", "apiario_id": "TEK-NOH-B", "lat": 20.105, "lon": -89.32}
    brote = detectar_brote(a, [vecino])
    assert detectar_brote(a, [vecino], [brote]) is None


def test_enjambrazon_no_se_confunde_con_intoxicacion(sana):
    alertas = detectar(lectura(120, peso_kg=39.8, sonido_db=60.0), sana)
    assert ENJAMBRAZON in tipos(alertas)
    assert INTOXICACION not in tipos(alertas)


def test_frio_y_calor():
    assert FRIO in tipos(detectar(lectura(0, temp_int_c=28.0, temp_ext_c=12.0), []))
    calor = detectar(lectura(0, temp_int_c=40.5, temp_ext_c=42.0), [])
    assert calor[0]["tipo"] == GOLPE_CALOR and calor[0]["severidad"] == "critica"


def test_sequia():
    hist = [lectura(i * 60, humedad_pct=22.0, temp_ext_c=38.0) for i in range(4)]
    assert SEQUIA in tipos(detectar(lectura(240, humedad_pct=21.0, temp_ext_c=38.5), hist))


def test_hambruna_por_perdida_lenta_de_peso():
    hist = [lectura(i * 360, peso_kg=42.0 - 0.1 * i) for i in range(16)]  # 4 días, -0.4 kg/día
    assert HAMBRUNA in tipos(detectar(lectura(16 * 360, peso_kg=40.4), hist))


def test_cosecha_no_es_hambruna():
    hist = [lectura(i * 360, peso_kg=42.0 if i < 8 else 30.0) for i in range(16)]
    assert HAMBRUNA not in tipos(detectar(lectura(16 * 360, peso_kg=30.0), hist))


def test_ausencia_de_reina(sana):
    hist = sana + [lectura(120 + i * 10, sonido_hz=390.0) for i in range(3)]
    assert AUSENCIA_REINA in tipos(detectar(lectura(150, sonido_hz=395.0), hist))


def test_varroa_deterioro_lento():
    hist = [
        lectura(i * 60, temp_int_c=34.8 + (1.8 if i % 2 else -1.8), sonido_db=72.0 - 0.4 * i)
        for i in range(14)
    ]
    assert VARROA in tipos(detectar(lectura(14 * 60, temp_int_c=33.0, sonido_db=66.0), hist))


def test_alertas_vigentes_no_repiten_aviso(sana):
    alerta = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)
    vigentes, emitir = actualizar_alertas_vigentes({}, alerta, alerta[0]["ts"])
    assert len(emitir) == 1 and estado_colmena(vigentes) == "critica"
    otra = detectar(lectura(130, sonido_db=57.0, peso_kg=41.0), sana)
    vigentes, emitir = actualizar_alertas_vigentes(vigentes, otra, otra[0]["ts"])
    assert emitir == []


def test_nueva_sesion_limpia_el_estado(sana):
    alerta = detectar(lectura(120, sonido_db=58.0, peso_kg=41.2), sana)
    vigentes, _ = actualizar_alertas_vigentes({}, alerta, alerta[0]["ts"], None, "demo-1")
    vigentes, _ = actualizar_alertas_vigentes(vigentes, [], lectura(130)["ts"], "demo-1", "demo-2")
    assert estado_colmena(vigentes) == "sana"


def test_frente_frio_no_es_varroa():
    hist = [lectura(i * 10, temp_int_c=34.8 - (1.2 * (i - 5) if i > 5 else 0), temp_ext_c=12.0) for i in range(14)]
    assert VARROA not in tipos(detectar(lectura(140, temp_int_c=27.0, temp_ext_c=11.0), hist))
