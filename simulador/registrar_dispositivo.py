"""Registra el simulador como dispositivo en AWS IoT Core (Rol 2).

Crea un "thing", un certificado X.509 con su llave privada y le pega la política
IoT del stack. Todo se guarda en simulador/certs/ (que está en .gitignore).

  python registrar_dispositivo.py --politica <salida PoliticaIoT del sam deploy>
  python registrar_dispositivo.py --borrar        # al terminar: desactiva y borra el certificado
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.request

import boto3

AQUI = os.path.dirname(os.path.abspath(__file__))
CA_URL = "https://www.amazontrust.com/repository/AmazonRootCA1.pem"


def registrar(args):
    iot = boto3.client("iot", region_name=args.region)
    os.makedirs(args.certs, exist_ok=True)

    try:
        iot.create_thing(thingName=args.nombre)
    except iot.exceptions.ResourceAlreadyExistsException:
        pass

    cert = iot.create_keys_and_certificate(setAsActive=True)
    rutas = {
        "cert": os.path.join(args.certs, "dispositivo.pem.crt"),
        "key": os.path.join(args.certs, "privada.pem.key"),
        "ca": os.path.join(args.certs, "AmazonRootCA1.pem"),
    }
    with open(rutas["cert"], "w") as f:
        f.write(cert["certificatePem"])
    with open(rutas["key"], "w") as f:
        f.write(cert["keyPair"]["PrivateKey"])
    os.chmod(rutas["key"], 0o600)
    urllib.request.urlretrieve(CA_URL, rutas["ca"])

    iot.attach_policy(policyName=args.politica, target=cert["certificateArn"])
    iot.attach_thing_principal(thingName=args.nombre, principal=cert["certificateArn"])
    endpoint = iot.describe_endpoint(endpointType="iot:Data-ATS")["endpointAddress"]

    config = {
        **rutas,
        "endpoint": endpoint,
        "region": args.region,
        "thing": args.nombre,
        "politica": args.politica,
        "certificate_arn": cert["certificateArn"],
        "certificate_id": cert["certificateId"],
    }
    with open(os.path.join(args.certs, "config.json"), "w") as f:
        json.dump(config, f, indent=2)
    print(f"Listo. Endpoint: {endpoint}\nCertificado: {cert['certificateId']}\nGuardado en {args.certs}/")


def borrar(args):
    with open(os.path.join(args.certs, "config.json")) as f:
        cfg = json.load(f)
    iot = boto3.client("iot", region_name=cfg["region"])
    arn, cid = cfg["certificate_arn"], cfg["certificate_id"]
    iot.detach_policy(policyName=cfg["politica"], target=arn)
    iot.detach_thing_principal(thingName=cfg["thing"], principal=arn)
    iot.update_certificate(certificateId=cid, newStatus="INACTIVE")
    iot.delete_certificate(certificateId=cid)
    iot.delete_thing(thingName=cfg["thing"])
    print(f"Certificado {cid} y thing {cfg['thing']} borrados. Puedes borrar {args.certs}/")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--politica", help="nombre de la política IoT (salida PoliticaIoT)")
    p.add_argument("--nombre", default="kab-simulador")
    p.add_argument("--region", default=os.environ.get("AWS_REGION", "us-east-1"))
    p.add_argument("--certs", default=os.path.join(AQUI, "certs"))
    p.add_argument("--borrar", action="store_true")
    a = p.parse_args()
    if a.borrar:
        borrar(a)
    elif not a.politica:
        p.error("falta --politica")
    else:
        registrar(a)
