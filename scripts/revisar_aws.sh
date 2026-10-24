#!/usr/bin/env bash
# Revisa que la cuenta de AWS tenga acceso a los 9 servicios de Kaab.
# Uso: ./scripts/revisar_aws.sh [region]
REGION="${1:-${AWS_REGION:-us-east-1}}"
ok()   { printf "  \033[92m✔\033[0m %-22s %s\n" "$1" "$2"; }
mal()  { printf "  \033[91m✘\033[0m %-22s %s\n" "$1" "$2"; }

echo "Cuenta:"
if ! ID=$(aws sts get-caller-identity --output text --query 'join(` `, [Account, Arn])' 2>&1); then
  mal "credenciales" "$ID"; exit 1
fi
ok "credenciales" "$ID"
echo "Servicios en $REGION:"

probar() {  # nombre, comando...
  local nombre="$1"; shift
  if salida=$("$@" 2>&1); then ok "$nombre" "$(echo "$salida" | head -1 | cut -c1-70)"; else mal "$nombre" "$(echo "$salida" | tail -1 | cut -c1-110)"; fi
}

probar "IoT Core"        aws iot describe-endpoint --endpoint-type iot:Data-ATS --region "$REGION" --output text
probar "Lambda"          aws lambda get-account-settings --region "$REGION" --query 'AccountLimit.ConcurrentExecutions' --output text
probar "DynamoDB"        aws dynamodb list-tables --region "$REGION" --query 'length(TableNames)' --output text
probar "EventBridge"     aws events list-event-buses --region "$REGION" --query 'length(EventBuses)' --output text
probar "SNS"             aws sns get-sms-sandbox-account-status --region "$REGION" --output text
probar "SNS SMS gasto"   aws sns get-sms-attributes --region "$REGION" --output text
probar "KMS"             aws kms list-keys --region "$REGION" --query 'length(Keys)' --output text
probar "S3"              aws s3api list-buckets --query 'length(Buckets)' --output text
probar "API Gateway"     aws apigatewayv2 get-apis --region "$REGION" --query 'length(Items)' --output text
probar "CloudFormation"  aws cloudformation list-stacks --region "$REGION" --query 'length(StackSummaries)' --output text
probar "Bedrock"         aws bedrock list-foundation-models --region "$REGION" --by-provider anthropic --query 'length(modelSummaries)' --output text
probar "Bedrock perfiles" aws bedrock list-inference-profiles --region "$REGION" --query "inferenceProfileSummaries[?contains(inferenceProfileId, 'claude')].inferenceProfileId | [0:4]" --output text
echo
echo "SNS: 'True' en sandbox = solo manda SMS a números verificados (scripts/sms_verificar.sh)."
