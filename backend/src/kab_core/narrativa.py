"""Narrativa del expediente con Amazon Bedrock (Rol 4).

Bedrock SOLO redacta: recibe el JSON ya firmado y lo explica en español formal para
que el apicultor lo pueda presentar en una denuncia. La evidencia es el JSON, no el
texto. Si Bedrock falla, se usa una plantilla fija para que la demo nunca se caiga.
"""
from __future__ import annotations

import json
import logging

log = logging.getLogger(__name__)

INSTRUCCIONES = (
    "Eres un perito técnico que redacta expedientes para apicultores de Yucatán. "
    "Con base ÚNICAMENTE en el JSON que te doy, redacta en español formal un expediente "
    "de máximo 350 palabras para acompañar una denuncia por intoxicación de abejas. "
    "Estructura: 1) Hechos (qué, cuándo, dónde, con horas y cifras exactas del JSON), "
    "2) Datos técnicos de los sensores, 3) Por qué el patrón indica intoxicación y no una "
    "causa natural, 4) Autoridades ante las que se puede presentar. "
    "No inventes datos, nombres, leyes ni artículos que no estén en el JSON. "
    "Si un dato no está, dilo. Devuelve solo el texto del expediente, sin markdown."
)


def plantilla_respaldo(expediente: dict) -> str:
    a, u = expediente["alerta"], expediente["ubicacion"]
    m = a.get("metricas", {})
    lineas = [
        f"EXPEDIENTE {expediente['expediente_id']}",
        "",
        f"Hechos: el {a['detectada_en']} (UTC) los sensores de la colmena {u['colmena_id']}, "
        f"apiario {u.get('apiario_nombre') or u.get('apiario_id')}, municipio de {u.get('municipio') or 'N/D'}, "
        f"Yucatán (lat {u.get('lat')}, lon {u.get('lon')}), registraron: {a['descripcion']}",
    ]
    if "caida_sonido_db" in m:
        lineas.append(
            f"El zumbido pasó de {m.get('sonido_base_db')} dB a {m.get('sonido_actual_db')} dB y el peso de "
            f"{m.get('peso_base_kg')} kg a {m.get('peso_actual_kg')} kg."
        )
    if m.get("apiarios"):
        lineas.append(f"El mismo patrón apareció en los apiarios {', '.join(m['apiarios'])}, "
                      f"a {m.get('distancia_max_km')} km o menos entre sí.")
    lineas += [
        f"Se adjuntan {len(expediente['lecturas_sensor'])} lecturas del sensor.",
        "La caída simultánea de sonido y peso no corresponde a un descenso nocturno de actividad.",
        "Autoridades sugeridas: " + "; ".join(expediente.get("autoridades_sugeridas", [])) + ".",
        "",
        "(Texto generado con plantilla de respaldo.)",
    ]
    return "\n".join(lineas)


def _con_anthropic(model_id: str, region: str, contenido: str) -> str:
    from anthropic import AnthropicBedrockMantle

    cliente = AnthropicBedrockMantle(aws_region=region, timeout=60.0, max_retries=1)
    respuesta = cliente.messages.create(
        model=model_id,
        max_tokens=16000,
        output_config={"effort": "low"},
        system=INSTRUCCIONES,
        messages=[{"role": "user", "content": contenido}],
    )
    if respuesta.stop_reason == "refusal":
        raise RuntimeError("el modelo rechazó la solicitud")
    return "".join(b.text for b in respuesta.content if b.type == "text").strip()


def _con_converse(model_id: str, region: str, contenido: str) -> str:
    """Para modelos que no son de Anthropic (p. ej. Amazon Nova) vía la API Converse."""
    import boto3

    cliente = boto3.client("bedrock-runtime", region_name=region)
    r = cliente.converse(
        modelId=model_id,
        system=[{"text": INSTRUCCIONES}],
        messages=[{"role": "user", "content": [{"text": contenido}]}],
        inferenceConfig={"maxTokens": 2000},
    )
    return "".join(p.get("text", "") for p in r["output"]["message"]["content"]).strip()


def redactar_narrativa(expediente: dict, model_id: str, region: str):
    """Devuelve (texto, fuente). fuente = 'bedrock:<modelo>' o 'plantilla'."""
    contenido = "JSON del expediente firmado:\n" + json.dumps(expediente, ensure_ascii=False, indent=2)
    if model_id:
        try:
            if model_id.startswith("anthropic."):
                texto = _con_anthropic(model_id, region, contenido)
            else:
                texto = _con_converse(model_id, region, contenido)
            if texto:
                # el tablero muestra texto plano: quitar marcas de markdown que a veces agrega el modelo
                texto = texto.replace("**", "").replace("## ", "").replace("# ", "")
                return texto, f"bedrock:{model_id}"
        except Exception:  # la demo no se cae si Bedrock falla
            log.exception("Bedrock falló; uso la plantilla de respaldo")
    return plantilla_respaldo(expediente), "plantilla"
