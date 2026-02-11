#!/usr/bin/env sh
set -eu

# Renderiza o datasource do Prometheus com base no env var PN_PROMETHEUS_URL.
# Isso evita "datasource sem URL" quando o Grafana nao expande ${VAR} no provisioning.
if [ -n "${PN_PROMETHEUS_URL:-}" ]; then
  envsubst < /etc/grafana/provisioning/datasources/datasource.yml > /tmp/datasource.yml
  mv /tmp/datasource.yml /etc/grafana/provisioning/datasources/datasource.yml
fi

if [ -n "${PORT:-}" ]; then
  export GF_SERVER_HTTP_PORT="${PORT}"
fi

# Garante que o login efetivo acompanhe o config var do Heroku e evita drift.
if [ -n "${GF_SECURITY_ADMIN_PASSWORD:-}" ]; then
  grafana cli --homepath /usr/share/grafana admin reset-admin-password "${GF_SECURITY_ADMIN_PASSWORD}" >/dev/null
fi

exec /run.sh
