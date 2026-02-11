#!/usr/bin/env sh
set -eu

PORT_VALUE="${PORT:-9090}"
TARGET_VALUE="${PN_METRICS_TARGET:-neurorelatopoc-60b95d8f43fd.herokuapp.com:443}"

# Renderiza variáveis no config sem depender de flags específicas de versão.
sed \
  -e "s|\${PORT}|${PORT_VALUE}|g" \
  -e "s|\${PN_METRICS_TARGET}|${TARGET_VALUE}|g" \
  /etc/prometheus/prometheus.yml > /tmp/prometheus.yml

exec /bin/prometheus \
  --config.file=/tmp/prometheus.yml \
  --web.listen-address="0.0.0.0:${PORT_VALUE}"
