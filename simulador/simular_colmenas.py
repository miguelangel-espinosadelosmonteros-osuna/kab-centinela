"""Simulador de colmenas de KAB Centinela (Rol 2).

Modos:
  --modo local   corre la detección en esta computadora (plan B sin internet)
  --modo iot     publica por MQTT a AWS IoT Core (necesita registrar_dispositivo.py)

Escenarios: normal, fumigacion, frio, calor, sequia, hambruna, sin_reina,
            enjambrazon, varroa, todo

Ejemplos:
  python simular_colmenas.py --modo local --escenario todo
  python simular_colmenas.py --modo iot --escenario fumigacion --velocidad 0.5
  python simular_colmenas.py --modo iot --archivo datos_companero.jsonl   # reproduce un archivo
  python simular_colmenas.py --modo iot --escenario normal --cortar TEK-03 # prueba el Last Will
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, "..", "backend", "src"))

# ----------------------------------------------------------- escenarios
# Cada escenario: qué colmenas afecta, cuántos minutos simula cada "tick",
# cuántos ticks sanos hay antes (calentamiento) y cómo cambia la lectura.
ESCENARIOS = {
    "normal": {"afecta": [], "min_tick": 10, "calentar": 8, "ticks": 14},
    "fumigacion": {"afecta": ["TEK-01", "TEK-02", "TEK-03", "TEK-04", "TEK-05"], "min_tick": 10, "calentar": 8, "ticks": 16},
    "frio": {"afecta": ["PET-01", "PET-02"], "min_tick": 10, "calentar": 6, "ticks": 12},
    "calor": {"afecta": ["TEK-01", "TEK-04"], "min_tick": 10, "calentar": 6, "ticks": 12},
    "sequia": {"afecta": ["PET-01", "PET-02", "TEK-03"], "min_tick": 30, "calentar": 4, "ticks": 20},
    "hambruna": {"afecta": ["PET-01"], "min_tick": 360, "calentar": 2, "ticks": 24},
    "sin_reina": {"afecta": ["TEK-02"], "min_tick": 10, "calentar": 8, "ticks": 14},
    "enjambrazon": {"afecta": ["PET-02"], "min_tick": 10, "calentar": 8, "ticks": 14},
    "varroa": {"afecta": ["TEK-05"], "min_tick": 60, "calentar": 2, "ticks": 28},
}
ORDEN_TODO = ["fumigacion", "frio", "calor", "sequia", "hambruna", "sin_reina", "enjambrazon", "varroa"]


def efecto(escenario: str, lec: dict, k: int, colmena_id: str):
    """Modifica la lectura. k = ticks desde que empezó el problema (0, 1, 2...)."""
    if escenario == "fumigacion":
        retraso = 0 if colmena_id.startswith("TEK-0") and colmena_id <= "TEK-03" else 1  # el dron llega después a B
        k = k - retraso
        if k < 0:
            return
        lec["sonido_db"] -= min(18.0, 5.0 * (k + 1))
        lec["peso_kg"] -= min(1.3, 0.35 * (k + 1))
        lec["sonido_hz"] += min(40.0, 15.0 * (k + 1))
    elif escenario == "frio":
        lec["temp_ext_c"] = max(10.0, lec["temp_ext_c"] - 3.0 * (k + 1))
        lec["temp_int_c"] = max(26.5, lec["temp_int_c"] - 1.2 * (k + 1))
        lec["sonido_db"] -= min(6.0, 1.5 * (k + 1))  # baja el zumbido, pero NO el peso
    elif escenario == "calor":
        lec["temp_ext_c"] = min(43.0, lec["temp_ext_c"] + 2.5 * (k + 1))
        lec["temp_int_c"] = min(40.8, lec["temp_int_c"] + 1.0 * (k + 1))
        lec["sonido_db"] += 3.0  # ventilando
    elif escenario == "sequia":
        lec["humedad_pct"] = max(18.0, lec["humedad_pct"] - 12.0 * (k + 1))
        lec["temp_ext_c"] = min(39.0, lec["temp_ext_c"] + 3.0 * (k + 1))
    elif escenario == "hambruna":
        # sin floración: no hay ganancia de néctar y la colonia gasta ~0.4 kg/día de reservas
        lec["peso_kg"] -= 0.22 * (k + 1)
    elif escenario == "sin_reina":
        lec["sonido_hz"] = 385.0 + random.uniform(0, 25)
        lec["sonido_db"] += 2.0
    elif escenario == "enjambrazon":
        if k < 3:
            lec["sonido_hz"] = 430.0 + random.uniform(0, 30)  # "piping" de reinas
            lec["temp_int_c"] += 1.5
        else:
            lec["peso_kg"] -= 2.3
            lec["sonido_db"] -= 3.0
    elif escenario == "varroa":
        lec["temp_int_c"] += 1.9 if k % 2 else -1.9
        lec["sonido_db"] -= min(8.0, 0.35 * k)


def lectura_sana(c: dict, ts: datetime, tick: int, min_tick: int, sesion: str) -> dict:
    hora = (ts.hour - 6) % 24  # hora local de Yucatán (UTC-6)
    ciclo = math.sin((hora - 6) / 24 * 2 * math.pi)  # +1 a mediodía, -1 de madrugada
    crecimiento = 0.02 * tick * min_tick / 60  # floración: +0.5 kg/día aprox.
    return {
        "colmena_id": c["colmena_id"],
        "apiario_id": c["apiario_id"],
        "apiario_nombre": c["apiario_nombre"],
        "municipio": c["municipio"],
        "apicultor": c.get("apicultor"),
        "lat": c["lat"],
        "lon": c["lon"],
        "ts": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "peso_kg": c["peso_kg"] + crecimiento + random.uniform(-0.05, 0.05),
        "temp_int_c": 34.8 + random.uniform(-0.3, 0.3),
        "temp_ext_c": 29.0 + 4.0 * ciclo + random.uniform(-0.5, 0.5),
        "humedad_pct": 68.0 - 10.0 * ciclo + random.uniform(-2, 2),
        "sonido_db": 72.0 + 2.0 * ciclo + random.uniform(-0.8, 0.8),
        "sonido_hz": 250.0 + random.uniform(-15, 15),
        "bateria_pct": max(20.0, 95.0 - tick * 0.05),
        "sesion": sesion,
    }


def generar(escenario: str, colmenas: list, inicio: datetime, ticks=None):
    """Genera las lecturas tick por tick: [[lecturas del tick 0], [tick 1], ...]."""
    cfg = ESCENARIOS[escenario]
    sesion = f"sim-{escenario}-{inicio.strftime('%H%M%S')}"
    total = ticks or cfg["ticks"]
    for tick in range(total):
        ts = inicio + timedelta(minutes=tick * cfg["min_tick"])
        grupo = []
        for c in colmenas:
            lec = lectura_sana(c, ts, tick, cfg["min_tick"], sesion)
            k = tick - cfg["calentar"]
            if c["colmena_id"] in cfg["afecta"] and k >= 0:
                efecto(escenario, lec, k, c["colmena_id"])
            grupo.append({k2: (round(v, 2) if isinstance(v, float) and k2 not in ("lat", "lon") else v)
                          for k2, v in lec.items()})
        yield grupo


def leer_archivo(ruta: str) -> list:
    """Lee lecturas de .json (lista), .jsonl (una por línea) o .csv (encabezados = campos del contrato)."""
    with open(ruta, encoding="utf-8") as f:
        if ruta.endswith(".csv"):
            filas = list(csv.DictReader(f))
        elif ruta.endswith(".jsonl"):
            filas = [json.loads(l) for l in f if l.strip()]
        else:
            datos = json.load(f)
            filas = datos.get("lecturas", datos) if isinstance(datos, dict) else datos
    filas.sort(key=lambda r: str(r.get("ts")))
    sesion = f"archivo-{datetime.now().strftime('%H%M%S')}"
    for r in filas:
        r.setdefault("sesion", sesion)
    return filas


# ------------------------------------------------------------ destinos
COLOR = {"critica": "\033[91m", "alta": "\033[93m", "media": "\033[96m", "baja": "\033[37m"}


class DestinoLocal:
    """Corre las mismas reglas que la Lambda, en memoria."""

    def __init__(self):
        from kab_core import deteccion as d
        from kab_core.contrato import validar_lectura

        self.d, self.validar = d, validar_lectura
        self.historial, self.vigentes, self.eventos = {}, {}, []

    def enviar(self, datos: dict):
        d = self.d
        lec = self.validar(datos)
        cid, sesion = lec["colmena_id"], lec.get("sesion")
        hist = self.historial.setdefault((cid, sesion), [])  # igual que la Lambda: historial por corrida
        alertas = d.detectar(lec, hist)
        for intox in [a for a in alertas if a["tipo"] == d.INTOXICACION]:
            de_sesion = [e for e in self.eventos if e.get("sesion") == sesion]
            brote = d.detectar_brote(
                intox,
                [e for e in de_sesion if e["tipo"] == d.INTOXICACION],
                [e for e in de_sesion if e["tipo"] == d.BROTE_REGIONAL],
            )
            if brote:
                alertas.append(brote)
        previas, sesion_prev = self.vigentes.get(cid, ({}, None))
        vig, emitir = d.actualizar_alertas_vigentes(previas, alertas, lec["ts"], sesion_prev, lec.get("sesion"))
        self.vigentes[cid] = (vig, lec.get("sesion"))
        hist.append(lec)
        for a in emitir:
            self.eventos.append(a)
            print(f"  {COLOR.get(a['severidad'], '')}⚠ {a['severidad'].upper():8} {a['tipo']:18} "
                  f"{a['colmena_id']:7} {a['mensaje']}\033[0m")

    def cerrar(self):
        print(f"\nTotal de alertas: {len(self.eventos)}")


class DestinoIoT:
    """Un cliente MQTT por colmena (cada colmena es un 'dispositivo' con su Last Will)."""

    def __init__(self, certs_dir: str, keepalive: int = 10):
        import paho.mqtt.client as mqtt

        with open(os.path.join(certs_dir, "config.json")) as f:
            self.cfg = json.load(f)
        self.mqtt, self.keepalive, self.clientes = mqtt, keepalive, {}

    def _cliente(self, colmena_id: str):
        if colmena_id in self.clientes:
            return self.clientes[colmena_id]
        mqtt, cfg = self.mqtt, self.cfg
        c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"kab-{colmena_id}")
        c.tls_set(ca_certs=cfg["ca"], certfile=cfg["cert"], keyfile=cfg["key"])
        topico_estado = f"kab/colmenas/{colmena_id}/estado"
        c.will_set(topico_estado, json.dumps({"colmena_id": colmena_id, "estado": "desconectada"}), qos=1)
        c.connect(cfg["endpoint"], 8883, keepalive=self.keepalive)
        c.loop_start()
        c.publish(topico_estado, json.dumps({"colmena_id": colmena_id, "estado": "conectada"}), qos=1)
        self.clientes[colmena_id] = c
        return c

    def enviar(self, datos: dict):
        cid = datos["colmena_id"]
        info = self._cliente(cid).publish(f"kab/colmenas/{cid}/telemetria", json.dumps(datos), qos=1)
        info.wait_for_publish(timeout=10)

    def cortar(self, colmena_id: str):
        """Cierra el socket sin despedirse: IoT Core publica el Last Will (~15 s después)."""
        c = self.clientes.get(colmena_id)
        if c:
            c.loop_stop()
            c.socket().close()
            del self.clientes[colmena_id]
            print(f"  ✂ {colmena_id} desconectado de golpe: IoT Core publicará su Last Will")

    def cerrar(self):
        for c in self.clientes.values():
            c.disconnect()  # desconexión limpia: NO dispara el Last Will
            c.loop_stop()


# ---------------------------------------------------------------- main
def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--modo", choices=["local", "iot"], default="local")
    p.add_argument("--escenario", choices=list(ESCENARIOS) + ["todo"], default="fumigacion")
    p.add_argument("--velocidad", type=float, default=1.0, help="segundos reales entre ticks")
    p.add_argument("--ticks", type=int, help="cuántos ticks simular (por defecto, los del escenario)")
    p.add_argument("--archivo", help="reproducir lecturas de un .json/.jsonl/.csv en vez de generarlas")
    p.add_argument("--guardar", help="guardar lo generado en un .jsonl (p. ej. salida/lecturas.jsonl)")
    p.add_argument("--cortar", help="colmena a desconectar de golpe a la mitad (prueba Last Will, modo iot)")
    p.add_argument("--certs", default=os.path.join(AQUI, "certs"))
    p.add_argument("--semilla", type=int, default=7)
    args = p.parse_args()
    random.seed(args.semilla)

    with open(os.path.join(AQUI, "colmenas.json"), encoding="utf-8") as f:
        colmenas = json.load(f)["colmenas"]

    destino = DestinoIoT(args.certs) if args.modo == "iot" else DestinoLocal()
    salida = None
    if args.guardar:
        os.makedirs(os.path.dirname(args.guardar) or ".", exist_ok=True)
        salida = open(args.guardar, "w", encoding="utf-8")

    def enviar(lec):
        destino.enviar(lec)
        if salida:
            salida.write(json.dumps(lec, ensure_ascii=False) + "\n")

    try:
        if args.archivo:
            filas = leer_archivo(args.archivo)
            print(f"Reproduciendo {len(filas)} lecturas de {args.archivo} ({args.modo})")
            for i, lec in enumerate(filas):
                enviar(lec)
                if args.velocidad and i % len(colmenas) == len(colmenas) - 1:
                    time.sleep(args.velocidad)
        else:
            escenarios = ORDEN_TODO if args.escenario == "todo" else [args.escenario]
            inicio = datetime.now(timezone.utc).replace(microsecond=0)
            for esc in escenarios:
                cfg = ESCENARIOS[esc]
                print(f"\n▶ Escenario {esc}: {cfg['ticks']} ticks de {cfg['min_tick']} min "
                      f"(afecta {', '.join(cfg['afecta']) or 'ninguna'}) [{args.modo}]")
                for tick, grupo in enumerate(generar(esc, colmenas, inicio, args.ticks)):
                    print(f"  tick {tick:2d}  {grupo[0]['ts']}")
                    for lec in grupo:
                        if args.cortar and args.modo == "iot" and lec["colmena_id"] == args.cortar \
                                and tick >= (args.ticks or cfg["ticks"]) // 2:
                            if args.cortar in destino.clientes:
                                destino.cortar(args.cortar)
                            continue
                        enviar(lec)
                    time.sleep(args.velocidad)
    finally:
        destino.cerrar()
        if salida:
            salida.close()


if __name__ == "__main__":
    main()
