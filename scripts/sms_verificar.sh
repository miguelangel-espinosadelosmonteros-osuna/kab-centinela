#!/usr/bin/env bash
# Verifica un teléfono en el sandbox de SMS de SNS y lo suscribe a las alertas.
#   ./scripts/sms_verificar.sh +529991234567            -> manda el código por SMS
#   ./scripts/sms_verificar.sh +529991234567 123456     -> confirma el código y suscribe
# Cada SMS a México cuesta ~0.10 USD y el límite inicial es 1 USD/mes.
set -euo pipefail
TEL="$1"; CODIGO="${2:-}"
REGION="${AWS_REGION:-us-east-1}"
STACK="${STACK:-kab-centinela}"

if [ -z "$CODIGO" ]; then
  aws sns create-sms-sandbox-phone-number --phone-number "$TEL" --language-code es-419 --region "$REGION"
  echo "Código enviado a $TEL. Corre de nuevo con el código: $0 $TEL <codigo>"
  exit 0
fi

aws sns verify-sms-sandbox-phone-number --phone-number "$TEL" --one-time-password "$CODIGO" --region "$REGION"
aws sns set-sms-attributes --region "$REGION" --attributes DefaultSMSType=Transactional,DefaultSenderID=KAAB
TOPIC=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='TopicAlertas'].OutputValue" --output text)
aws sns subscribe --region "$REGION" --topic-arn "$TOPIC" --protocol sms --notification-endpoint "$TEL" \
  --attributes '{"FilterPolicyScope":"MessageAttributes","FilterPolicy":"{\"sms\":[\"si\"]}"}'
echo "Listo: $TEL recibirá los SMS críticos de $STACK."
