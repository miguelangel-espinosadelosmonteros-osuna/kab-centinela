"""Vacía las tablas de DynamoDB del stack para empezar un ensayo limpio.

Borra lecturas, estado de colmenas, alertas y la lista de documentos. Los expedientes
en S3 NO se borran (Object Lock no lo permite): siguen ahí hasta que venza la retención.

  python scripts/reiniciar_demo.py            # pregunta antes de borrar
  python scripts/reiniciar_demo.py --si       # sin preguntar
"""
import argparse

import boto3

TABLAS = ["TablaLecturas", "TablaColmenas", "TablaEventos", "TablaDocumentos"]


def vaciar(tabla):
    llaves = [k["AttributeName"] for k in tabla.key_schema]
    total, kwargs = 0, {"ProjectionExpression": ", ".join(f"#k{i}" for i in range(len(llaves))),
                        "ExpressionAttributeNames": {f"#k{i}": k for i, k in enumerate(llaves)}}
    with tabla.batch_writer() as lote:
        while True:
            r = tabla.scan(**kwargs)
            for item in r["Items"]:
                lote.delete_item(Key={k: item[k] for k in llaves})
                total += 1
            if "LastEvaluatedKey" not in r:
                return total
            kwargs["ExclusiveStartKey"] = r["LastEvaluatedKey"]


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--stack", default="kab-centinela")
    p.add_argument("--region", default="us-east-1")
    p.add_argument("--si", action="store_true")
    a = p.parse_args()

    cfn = boto3.client("cloudformation", region_name=a.region)
    nombres = {r["LogicalResourceId"]: r["PhysicalResourceId"]
               for r in cfn.describe_stack_resources(StackName=a.stack)["StackResources"]
               if r["LogicalResourceId"] in TABLAS}
    if not a.si and input(f"¿Vaciar {', '.join(nombres.values())}? (s/n) ").lower() != "s":
        raise SystemExit("Cancelado.")
    ddb = boto3.resource("dynamodb", region_name=a.region)
    for logico, fisico in nombres.items():
        print(f"{logico}: {vaciar(ddb.Table(fisico))} registros borrados")
