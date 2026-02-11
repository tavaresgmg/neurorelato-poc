#!/usr/bin/env sh
set -eu

PORT_VALUE="${PORT:-9090}"
TARGET_VALUE="${PN_METRICS_TARGET:-neurorelatopoc-60b95d8f43fd.herokuapp.com:443}"
METRICS_AUTH_USER_VALUE="${PN_METRICS_BASIC_AUTH_USER:-}"
METRICS_AUTH_PASSWORD_VALUE="${PN_METRICS_BASIC_AUTH_PASSWORD:-}"

if [ -n "$METRICS_AUTH_USER_VALUE" ] && [ -z "$METRICS_AUTH_PASSWORD_VALUE" ]; then
  echo "ERROR: PN_METRICS_BASIC_AUTH_PASSWORD ausente (PN_METRICS_BASIC_AUTH_USER definido)." >&2
  exit 1
fi

if [ -z "$METRICS_AUTH_USER_VALUE" ] && [ -n "$METRICS_AUTH_PASSWORD_VALUE" ]; then
  echo "ERROR: PN_METRICS_BASIC_AUTH_USER ausente (PN_METRICS_BASIC_AUTH_PASSWORD definido)." >&2
  exit 1
fi

if [ -z "$METRICS_AUTH_USER_VALUE" ] && [ -z "$METRICS_AUTH_PASSWORD_VALUE" ]; then
  echo "ERROR: PN_METRICS_BASIC_AUTH_USER e PN_METRICS_BASIC_AUTH_PASSWORD sao obrigatorios." >&2
  exit 1
fi

# Renderiza variáveis no config sem depender de flags específicas de versão.
sed \
  -e "s|\${PORT}|${PORT_VALUE}|g" \
  -e "s|\${PN_METRICS_TARGET}|${TARGET_VALUE}|g" \
  -e "s|\${PN_METRICS_BASIC_AUTH_USER}|${METRICS_AUTH_USER_VALUE}|g" \
  -e "s|\${PN_METRICS_BASIC_AUTH_PASSWORD}|${METRICS_AUTH_PASSWORD_VALUE}|g" \
  /etc/prometheus/prometheus.yml > /tmp/prometheus.yml

exec /bin/prometheus \
  --config.file=/tmp/prometheus.yml \
  --web.listen-address="0.0.0.0:${PORT_VALUE}"
