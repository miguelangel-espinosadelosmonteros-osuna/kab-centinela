# Contrato de datos: lecturas de colmena

Si generas datos para KAB Centinela, cada lectura debe tener este formato. Sirve para el simulador, para datos en archivo y para un sensor real.

## Una lectura

```json
{
  "colmena_id": "TEK-01",
  "apiario_id": "TEK-NOH-A",
  "apiario_nombre": "Nohalal A",
  "municipio": "Tekax",
  "apicultor": "Cooperativa Nohalal",
  "ts": "2026-10-24T15:04:05Z",
  "lat": 20.096,
  "lon": -89.33,
  "peso_kg": 42.3,
  "temp_int_c": 34.8,
  "temp_ext_c": 29.1,
  "humedad_pct": 62,
  "sonido_db": 72.0,
  "sonido_hz": 250,
  "bateria_pct": 88,
  "sesion": "datos-equipo-1"
}
```

| Campo | Obligatorio | Unidad / formato | Rango válido | Valor sano típico |
| --- | --- | --- | --- | --- |
| `colmena_id` | sí | texto único | — | `TEK-01` |
| `apiario_id` | sí | texto | — | `TEK-NOH-A` |
| `ts` | sí | ISO 8601 en UTC (`Z`), o epoch en segundos o milisegundos | — | una lectura cada 10 min |
| `lat`, `lon` | sí | grados decimales | — | Península de Yucatán |
| `peso_kg` | sí | kg (colmena completa) | 0–250 | 35–50 |
| `temp_int_c` | sí | °C dentro de la cámara de cría | -10–70 | 34–35.5 |
| `sonido_db` | sí | dB del zumbido | 0–140 | 70–74 |
| `sonido_hz` | sí | frecuencia dominante en Hz | 0–5000 | 230–270 |
| `temp_ext_c` | no | °C del ambiente | -10–60 | 25–33 |
| `humedad_pct` | no | % de humedad relativa del ambiente | 0–100 | 55–75 |
| `bateria_pct` | no | % | 0–100 | >15 |
| `apiario_nombre`, `municipio`, `apicultor` | no | texto | — | — |
| `sesion` | no | texto que agrupa una corrida | — | si falta, el simulador pone una |

Si una lectura no cumple el contrato, la Lambda la rechaza y registra el motivo en CloudWatch.

## Cómo se ve cada problema en los datos

Las reglas viven en [`backend/src/kab_core/deteccion.py`](../backend/src/kab_core/deteccion.py). Para generar un caso, haz que los datos cumplan su condición:

| Problema | Condición que dispara la alerta |
| --- | --- |
| Intoxicación | `sonido_db` cae 10 dB o más **y** `peso_kg` cae 0.5 kg o más, respecto a la mediana de 30 min a 6 h antes (pide al menos 3 lecturas en esa ventana) |
| Brote regional | Intoxicación en 2 apiarios distintos a 3 km o menos, con menos de 6 h de diferencia |
| Frío extremo | `temp_int_c` < 30 y `temp_ext_c` < 18 |
| Golpe de calor | `temp_int_c` ≥ 38 o `temp_ext_c` ≥ 41 (crítica si `temp_int_c` ≥ 40) |
| Sequía | Promedio de 6 h con `humedad_pct` < 30 y `temp_ext_c` ≥ 35 |
| Hambruna | Pierde 0.25 kg o más por día, con al menos 48 h de datos y sin saltos de más de 1 kg |
| Ausencia de reina | 3 lecturas seguidas con `sonido_hz` ≥ 350, peso estable y sin calentamiento |
| Enjambrazón | El peso cae entre 1.5 y 5 kg en menos de 40 min |
| Varroa o enfermedad | En 24 h, `temp_int_c` sube y baja (desviación ≥ 1.2 °C) y `sonido_db` baja 3 dB o más poco a poco |
| Batería baja | `bateria_pct` < 15 |

## Cómo mandar tus datos

Guarda tus lecturas en `.jsonl` (una por línea), `.json` (una lista) o `.csv` (los encabezados son los nombres de los campos). Luego:

```bash
cd simulador
# probar en local (sin AWS)
python simular_colmenas.py --modo local --archivo mis_datos.jsonl --velocidad 0
# mandarlas a AWS IoT Core como si fueran colmenas reales
python simular_colmenas.py --modo iot --archivo mis_datos.jsonl --velocidad 0.5
```

Hay un ejemplo completo de una fumigación en [`docs/ejemplo_lecturas.jsonl`](ejemplo_lecturas.jsonl).

Para publicar directo por MQTT, el tópico es `kab/colmenas/{colmena_id}/telemetria`.
