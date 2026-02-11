#!/usr/bin/env sh
set -eu

require_bin() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: comando ausente: $1" >&2
    exit 1
  }
}

require_bin envsubst

PORT="${PORT:-9090}"
PN_METRICS_TARGET="${PN_METRICS_TARGET:-neurorelatopoc-60b95d8f43fd.herokuapp.com:443}"
PN_METRICS_BASIC_AUTH_USER="${PN_METRICS_BASIC_AUTH_USER:-}"
PN_METRICS_BASIC_AUTH_PASSWORD="${PN_METRICS_BASIC_AUTH_PASSWORD:-}"

if [ -n "$PN_METRICS_BASIC_AUTH_USER" ] && [ -z "$PN_METRICS_BASIC_AUTH_PASSWORD" ]; then
  echo "ERROR: PN_METRICS_BASIC_AUTH_PASSWORD ausente (PN_METRICS_BASIC_AUTH_USER definido)." >&2
  exit 1
fi

if [ -z "$PN_METRICS_BASIC_AUTH_USER" ] && [ -n "$PN_METRICS_BASIC_AUTH_PASSWORD" ]; then
  echo "ERROR: PN_METRICS_BASIC_AUTH_USER ausente (PN_METRICS_BASIC_AUTH_PASSWORD definido)." >&2
  exit 1
fi

if [ -z "$PN_METRICS_BASIC_AUTH_USER" ] && [ -z "$PN_METRICS_BASIC_AUTH_PASSWORD" ]; then
  echo "ERROR: PN_METRICS_BASIC_AUTH_USER e PN_METRICS_BASIC_AUTH_PASSWORD sao obrigatorios." >&2
  exit 1
fi

# Renderiza variáveis no config sem fragilidade de escaping manual.
export PORT PN_METRICS_TARGET PN_METRICS_BASIC_AUTH_USER PN_METRICS_BASIC_AUTH_PASSWORD
envsubst < /etc/prometheus/prometheus.yml > /tmp/prometheus.yml

exec /bin/prometheus \
  --config.file=/tmp/prometheus.yml \
  --web.listen-address="0.0.0.0:${PORT}"
