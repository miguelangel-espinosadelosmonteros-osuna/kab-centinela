"""Reglas de alerta de Kaab (Rol 3).

Cada regla recibe la lectura actual y el historial reciente de la MISMA colmena
y decide si hay alerta. Son funciones puras: no tocan AWS, así se prueban en local.

Idea clave para explicar en la demo:
  * Intoxicación = el zumbido cae Y el peso cae a la vez. Una noche fresca baja el
    zumbido pero no el peso, así que no dispara la alerta.
  * Brote regional = intoxicación en DOS apiarios distintos a menos de 3 km en
    menos de 6 horas: es el patrón de una fumigación (avioneta o dron).
"""
from __future__ import annotations

import hashlib
from statistics import mean, median, pstdev

from .contrato import ts_a_datetime
from .geo import distancia_km

# Tipos de alerta
INTOXICACION = "INTOXICACION"
BROTE_REGIONAL = "BROTE_REGIONAL"
FRIO = "FRIO_EXTREMO"
GOLPE_CALOR = "GOLPE_CALOR"
SEQUIA = "SEQUIA"
HAMBRUNA = "HAMBRUNA"
AUSENCIA_REINA = "AUSENCIA_REINA"
ENJAMBRAZON = "ENJAMBRAZON"
VARROA = "VARROA_ENFERMEDAD"
DESCONEXION = "DESCONEXION"
BATERIA_BAJA = "BATERIA_BAJA"

SEVERIDAD_ORDEN = {"baja": 1, "media": 2, "alta": 3, "critica": 4}

CATALOGO = {
    INTOXICACION: (
        "critica",
        "Posible intoxicación por plaguicida",
        "Cierra la piquera, no muevas la colmena, toma fotos y guarda abejas muertas "
        "en el congelador como muestra. El expediente firmado ya se está generando.",
    ),
    BROTE_REGIONAL: (
        "critica",
        "Brote regional: patrón de fumigación",
        "Avisa a los apicultores en 3 km, anota aeronaves, drones y cultivos cercanos "
        "y presenta la denuncia con el expediente firmado.",
    ),
    FRIO: (
        "alta",
        "Frío extremo en la cámara de cría",
        "Reduce la piquera y protege la colmena del viento del norte.",
    ),
    GOLPE_CALOR: (
        "alta",
        "Golpe de calor",
        "Da sombra, ventila y pon agua limpia cerca. No abras la colmena al mediodía.",
    ),
    SEQUIA: (
        "media",
        "Estrés por sequía",
        "Coloca bebederos con agua limpia y flotadores; revisa las reservas de miel.",
    ),
    HAMBRUNA: (
        "media",
        "Hambruna: la colonia se come sus reservas",
        "No hay floración cerca (deforestación o sequía). Alimenta con jarabe y "
        "considera mover el apiario a una zona con selva.",
    ),
    AUSENCIA_REINA: (
        "alta",
        "Posible ausencia de reina",
        "Revisa si hay huevos o cría nueva; introduce una reina o una celda real.",
    ),
    ENJAMBRAZON: (
        "alta",
        "Enjambrazón: la colonia se dividió",
        "Busca el enjambre cerca del apiario para capturarlo y da espacio a la colmena.",
    ),
    VARROA: (
        "media",
        "Posible varroa o enfermedad",
        "Haz un conteo de varroa (azúcar glass o alcohol) y trata si pasa de 3%.",
    ),
    DESCONEXION: (
        "media",
        "Sensor desconectado",
        "Revisa el apiario: puede ser batería, señal, robo o incendio.",
    ),
    BATERIA_BAJA: (
        "baja",
        "Batería baja del sensor",
        "Cambia o recarga la batería del sensor.",
    ),
}

UMBRALES = {
    # Línea base: mediana de las lecturas entre 6 h y 30 min antes de la actual
    "base_desde_min": 360,
    "base_hasta_min": 30,
    "base_min_lecturas": 3,
    # Intoxicación
    "intox_caida_db": 10.0,
    "intox_caida_peso_kg": 0.5,
    # Brote regional
    "brote_radio_km": 3.0,
    "brote_ventana_h": 6,
    # Temperatura (la cría necesita 32-36 °C)
    "frio_temp_int": 30.0,
    "frio_temp_ext": 18.0,
    "calor_temp_int": 38.0,
    "calor_critico_temp_int": 40.0,
    "calor_temp_ext": 41.0,
    # Sequía
    "sequia_humedad": 30.0,
    "sequia_temp_ext": 35.0,
    "sequia_ventana_min": 360,
    "sequia_min_lecturas": 3,
    # Hambruna (tendencia de peso de varios días)
    "hambruna_ventana_dias": 7,
    "hambruna_min_horas": 48,
    "hambruna_min_lecturas": 6,
    "hambruna_pendiente_kg_dia": -0.25,
    "hambruna_salto_max_kg": 1.0,
    "hambruna_caida_reciente_max_kg": 0.5,
    # Ausencia de reina ("rugido" agudo sostenido)
    "reina_hz": 350.0,
    "reina_ventana_min": 120,
    "reina_min_lecturas": 3,
    "reina_peso_estable_kg": 0.4,
    "reina_subida_temp_max": 1.0,
    # Enjambrazón (caída brusca de peso: se va media colonia)
    "enjambre_caida_min_kg": 1.5,
    "enjambre_caida_max_kg": 5.0,
    "enjambre_ventana_min": 40,
    # Varroa / enfermedad (deterioro lento)
    "varroa_ventana_min": 1440,
    "varroa_min_lecturas": 12,
    "varroa_std_temp": 1.2,
    "varroa_caida_db": 3.0,
    "varroa_salto_max_db": 6.0,
    # Sensor
    "bateria_baja": 15.0,
}

# Cuánto tiempo sigue "activa" una alerta (y no se repite el aviso)
VIGENCIA_MIN = {"critica": 24 * 60, "alta": 180, "media": 360, "baja": 360}
# Los problemas lentos duran días: no se repite el aviso cada pocas horas
VIGENCIA_TIPO_MIN = {HAMBRUNA: 72 * 60, VARROA: 72 * 60, SEQUIA: 12 * 60, BATERIA_BAJA: 72 * 60}


# ---------------------------------------------------------------- utilidades
def _edad_min(ts_actual: str, ts_otro: str) -> float:
    return (ts_a_datetime(ts_actual) - ts_a_datetime(ts_otro)).total_seconds() / 60


def _con_edad(historial: list, ts_actual: str) -> list:
    """[(edad_min, lectura)] solo de lecturas anteriores, de la más vieja a la más nueva."""
    pares = []
    for lectura in historial:
        edad = _edad_min(ts_actual, lectura["ts"])
        if edad > 0:
            pares.append((edad, lectura))
    pares.sort(key=lambda p: -p[0])
    return pares


def _entre(hist: list, desde_min: float, hasta_min: float = 0) -> list:
    return [lectura for edad, lectura in hist if hasta_min <= edad <= desde_min]


def _valores(lecturas: list, campo: str) -> list:
    return [lec[campo] for lec in lecturas if lec.get(campo) is not None]


def _linea_base(hist: list, u: dict):
    base = _entre(hist, u["base_desde_min"], u["base_hasta_min"])
    if len(base) < u["base_min_lecturas"]:
        return None
    return base


def _pendiente(xs: list, ys: list) -> float:
    """Pendiente por mínimos cuadrados."""
    mx, my = mean(xs), mean(ys)
    den = sum((x - mx) ** 2 for x in xs)
    if den == 0:
        return 0.0
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / den


def nueva_alerta(tipo: str, origen: dict, mensaje: str, metricas: dict, severidad: str = None) -> dict:
    sev, titulo, recomendacion = CATALOGO[tipo]
    huella = f"{tipo}|{origen['colmena_id']}|{origen['ts']}".encode()
    return {
        "alerta_id": "ALR-" + hashlib.sha1(huella).hexdigest()[:12],
        "tipo": tipo,
        "severidad": severidad or sev,
        "titulo": titulo,
        "mensaje": mensaje,
        "recomendacion": recomendacion,
        "colmena_id": origen["colmena_id"],
        "apiario_id": origen.get("apiario_id"),
        "apiario_nombre": origen.get("apiario_nombre"),
        "municipio": origen.get("municipio"),
        "lat": origen.get("lat"),
        "lon": origen.get("lon"),
        "ts": origen["ts"],
        "sesion": origen.get("sesion"),
        "metricas": {k: (round(v, 2) if isinstance(v, float) else v) for k, v in metricas.items()},
    }


# -------------------------------------------------------------------- reglas
def regla_enjambrazon(lec, hist, u):
    recientes = _entre(hist, u["enjambre_ventana_min"])
    if not recientes:
        return None
    peso_max = max(_valores(recientes, "peso_kg"))
    caida = peso_max - lec["peso_kg"]
    if u["enjambre_caida_min_kg"] <= caida <= u["enjambre_caida_max_kg"]:
        return nueva_alerta(
            ENJAMBRAZON, lec,
            f"El peso cayó {caida:.1f} kg en menos de {u['enjambre_ventana_min']} min.",
            {"caida_peso_kg": caida, "peso_kg": lec["peso_kg"]},
        )
    return None


def regla_intoxicacion(lec, hist, u):
    base = _linea_base(hist, u)
    if not base:
        return None
    db_base = median(_valores(base, "sonido_db"))
    peso_base = median(_valores(base, "peso_kg"))
    caida_db = db_base - lec["sonido_db"]
    caida_peso = peso_base - lec["peso_kg"]
    if caida_db >= u["intox_caida_db"] and caida_peso >= u["intox_caida_peso_kg"]:
        return nueva_alerta(
            INTOXICACION, lec,
            f"El zumbido cayó {caida_db:.1f} dB y el peso {caida_peso:.2f} kg a la vez.",
            {
                "caida_sonido_db": caida_db,
                "caida_peso_kg": caida_peso,
                "sonido_base_db": db_base,
                "sonido_actual_db": lec["sonido_db"],
                "peso_base_kg": peso_base,
                "peso_actual_kg": lec["peso_kg"],
                "lecturas_base": len(base),
            },
        )
    return None


def regla_frio(lec, hist, u):
    ext = lec.get("temp_ext_c")
    if lec["temp_int_c"] < u["frio_temp_int"] and (ext is None or ext < u["frio_temp_ext"]):
        return nueva_alerta(
            FRIO, lec,
            f"Cámara de cría a {lec['temp_int_c']:.1f} °C (necesita 32-36 °C).",
            {"temp_int_c": lec["temp_int_c"], "temp_ext_c": ext},
        )
    return None


def regla_calor(lec, hist, u):
    tin, ext = lec["temp_int_c"], lec.get("temp_ext_c")
    if tin >= u["calor_temp_int"] or (ext is not None and ext >= u["calor_temp_ext"]):
        severidad = "critica" if tin >= u["calor_critico_temp_int"] else "alta"
        texto_ext = f" con {ext:.1f} °C afuera" if ext is not None else ""
        return nueva_alerta(
            GOLPE_CALOR, lec,
            f"Cámara de cría a {tin:.1f} °C{texto_ext}; la cera y la cría se dañan arriba de 38 °C.",
            {"temp_int_c": tin, "temp_ext_c": ext},
            severidad=severidad,
        )
    return None


def regla_sequia(lec, hist, u):
    recientes = _entre(hist, u["sequia_ventana_min"]) + [lec]
    humedades = _valores(recientes, "humedad_pct")
    temps = _valores(recientes, "temp_ext_c")
    if len(humedades) < u["sequia_min_lecturas"] or len(temps) < u["sequia_min_lecturas"]:
        return None
    if mean(humedades) < u["sequia_humedad"] and mean(temps) >= u["sequia_temp_ext"]:
        return nueva_alerta(
            SEQUIA, lec,
            f"Humedad promedio de {mean(humedades):.0f}% con {mean(temps):.1f} °C en las últimas horas.",
            {"humedad_promedio_pct": mean(humedades), "temp_ext_promedio_c": mean(temps)},
        )
    return None


def regla_hambruna(lec, hist, u):
    ventana = u["hambruna_ventana_dias"] * 1440
    puntos = [(-edad / 1440, l["peso_kg"]) for edad, l in hist if edad <= ventana]
    puntos.append((0.0, lec["peso_kg"]))
    if len(puntos) < u["hambruna_min_lecturas"]:
        return None
    if -puntos[0][0] * 24 < u["hambruna_min_horas"]:
        return None
    pesos = [p for _, p in puntos]
    salto_max = max((a - b for a, b in zip(pesos, pesos[1:])), default=0)
    if salto_max > u["hambruna_salto_max_kg"]:
        return None  # caída brusca: cosecha o enjambre, no hambruna
    hace_6h = [l["peso_kg"] for edad, l in hist if edad >= 360]
    if hace_6h and hace_6h[-1] - lec["peso_kg"] > u["hambruna_caida_reciente_max_kg"]:
        return None  # perdió mucho en pocas horas (envenenamiento, enjambre): la hambruna es lenta
    pendiente = _pendiente([d for d, _ in puntos], pesos)
    if pendiente <= u["hambruna_pendiente_kg_dia"]:
        dias = -puntos[0][0]
        return nueva_alerta(
            HAMBRUNA, lec,
            f"La colmena pierde {abs(pendiente):.2f} kg por día desde hace {dias:.0f} días.",
            {"pendiente_kg_dia": pendiente, "dias_observados": dias, "peso_kg": lec["peso_kg"]},
        )
    return None


def regla_reina(lec, hist, u):
    # las últimas N lecturas seguidas (dentro de la ventana) deben ser agudas
    recientes = (_entre(hist, u["reina_ventana_min"]) + [lec])[-u["reina_min_lecturas"]:]
    if len(recientes) < u["reina_min_lecturas"]:
        return None
    if min(_valores(recientes, "sonido_hz")) < u["reina_hz"]:
        return None
    pesos = _valores(recientes, "peso_kg")
    if max(pesos) - min(pesos) > u["reina_peso_estable_kg"]:
        return None
    base = _linea_base(hist, u)
    if base:
        subida = mean(_valores(recientes, "temp_int_c")) - median(_valores(base, "temp_int_c"))
        if subida >= u["reina_subida_temp_max"]:
            return None  # se están calentando para enjambrar, no es orfandad
    return nueva_alerta(
        AUSENCIA_REINA, lec,
        f"Zumbido agudo sostenido ({lec['sonido_hz']:.0f} Hz) en las últimas {len(recientes)} lecturas.",
        {"sonido_hz": lec["sonido_hz"], "lecturas": len(recientes)},
    )


def regla_varroa(lec, hist, u):
    recientes = _entre(hist, u["varroa_ventana_min"]) + [lec]
    if len(recientes) < u["varroa_min_lecturas"]:
        return None
    temps = _valores(recientes, "temp_int_c")
    if not 30.0 < mean(temps) < u["calor_temp_int"]:
        return None
    # Oscila (sube y baja) en vez de bajar parejo: un frente frío baja parejo, no es varroa
    difs = [b - a for a, b in zip(temps, temps[1:]) if abs(b - a) > 0.5]
    cambios_signo = sum(1 for a, b in zip(difs, difs[1:]) if (a > 0) != (b > 0))
    if pstdev(temps) < u["varroa_std_temp"] or cambios_signo < len(temps) / 3:
        return None
    dbs = _valores(recientes, "sonido_db")
    mitad = len(dbs) // 2
    caida = mean(dbs[:mitad]) - mean(dbs[mitad:])
    salto = max((a - b for a, b in zip(dbs, dbs[1:])), default=0)
    if caida >= u["varroa_caida_db"] and salto < u["varroa_salto_max_db"]:
        return nueva_alerta(
            VARROA, lec,
            f"La colonia no regula su temperatura (±{pstdev(temps):.1f} °C) y su zumbido "
            f"bajó {caida:.1f} dB poco a poco.",
            {"desviacion_temp_c": pstdev(temps), "caida_gradual_db": caida},
        )
    return None


def regla_bateria(lec, hist, u):
    bat = lec.get("bateria_pct")
    if bat is not None and bat < u["bateria_baja"]:
        return nueva_alerta(BATERIA_BAJA, lec, f"Batería al {bat:.0f}%.", {"bateria_pct": bat})
    return None


# --------------------------------------------------------------- orquestador
def detectar(lectura: dict, historial: list, umbrales: dict = None) -> list:
    """Corre todas las reglas sobre una lectura. Devuelve la lista de alertas."""
    u = {**UMBRALES, **(umbrales or {})}
    hist = _con_edad(historial, lectura["ts"])
    alertas = []

    # La enjambrazón también baja peso y zumbido: se revisa primero para no
    # confundirla con una intoxicación.
    enjambre = regla_enjambrazon(lectura, hist, u)
    intox = None if enjambre else regla_intoxicacion(lectura, hist, u)
    alertas += [a for a in (enjambre, intox) if a]

    for regla in (regla_frio, regla_calor, regla_sequia, regla_hambruna, regla_bateria):
        alerta = regla(lectura, hist, u)
        if alerta:
            alertas.append(alerta)

    if not enjambre and not intox:
        for regla in (regla_reina, regla_varroa):
            alerta = regla(lectura, hist, u)
            if alerta:
                alertas.append(alerta)
    return alertas


def detectar_brote(intox: dict, intox_recientes: list, brotes_recientes: list = (), umbrales: dict = None):
    """¿Esta intoxicación forma un brote con apiarios vecinos? Devuelve la alerta o None."""
    u = {**UMBRALES, **(umbrales or {})}
    ventana = u["brote_ventana_h"] * 60

    for brote in brotes_recientes:
        if abs(_edad_min(intox["ts"], brote["ts"])) <= ventana and intox["apiario_id"] in (
            brote.get("metricas", {}).get("apiarios") or []
        ):
            return None  # este apiario ya forma parte de un brote avisado

    vecinos = []
    for otro in intox_recientes:
        if otro.get("apiario_id") == intox["apiario_id"] or otro.get("lat") is None:
            continue
        if abs(_edad_min(intox["ts"], otro["ts"])) > ventana:
            continue
        d = distancia_km(intox["lat"], intox["lon"], otro["lat"], otro["lon"])
        if d <= u["brote_radio_km"]:
            vecinos.append((otro, d))
    if not vecinos:
        return None

    apiarios = sorted({intox["apiario_id"]} | {o["apiario_id"] for o, _ in vecinos})
    colmenas = sorted({intox["colmena_id"]} | {o["colmena_id"] for o, _ in vecinos})
    dist_max = max(d for _, d in vecinos)
    return nueva_alerta(
        BROTE_REGIONAL, intox,
        f"Intoxicación en {len(apiarios)} apiarios a {dist_max:.1f} km o menos en menos de "
        f"{u['brote_ventana_h']} h: patrón de fumigación.",
        {
            "apiarios": apiarios,
            "colmenas": colmenas,
            "distancia_max_km": dist_max,
            "eventos_relacionados": sorted({intox["alerta_id"]} | {o["alerta_id"] for o, _ in vecinos}),
        },
    )


# ------------------------------------------------------ estado de la colmena
def actualizar_alertas_vigentes(previas: dict, nuevas: list, ts_actual: str,
                                sesion_previa=None, sesion_actual=None):
    """Quita alertas vencidas, evita repetir avisos y devuelve (vigentes, a_emitir)."""
    if sesion_previa != sesion_actual:
        previas = {}  # nueva corrida del simulador: se empieza limpio
    vigentes = {}
    for tipo, info in (previas or {}).items():
        edad = _edad_min(ts_actual, info["ts"])
        vigencia = VIGENCIA_TIPO_MIN.get(tipo) or VIGENCIA_MIN.get(info["severidad"], 180)
        if 0 <= edad <= vigencia:
            vigentes[tipo] = info
    a_emitir = []
    for alerta in nuevas:
        if alerta["tipo"] in vigentes:
            continue
        vigentes[alerta["tipo"]] = {
            "ts": alerta["ts"],
            "severidad": alerta["severidad"],
            "titulo": alerta["titulo"],
            "alerta_id": alerta["alerta_id"],
        }
        a_emitir.append(alerta)
    return vigentes, a_emitir


def estado_colmena(vigentes: dict) -> str:
    """sana / atencion / alerta / critica según la alerta vigente más grave."""
    peor = max((SEVERIDAD_ORDEN[v["severidad"]] for v in (vigentes or {}).values()), default=0)
    return {0: "sana", 1: "atencion", 2: "atencion", 3: "alerta", 4: "critica"}[peor]
