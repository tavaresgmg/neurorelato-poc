#!/usr/bin/env sh
set -eu

APP_NAME="${APP_NAME:-neurorelatopoc}"
PROM_APP="${PROM_APP:-neurorelatopoc-prometheus}"
GRAFANA_APP="${GRAFANA_APP:-neurorelatopoc-grafana}"

require_bin() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERRO: comando ausente: $1" >&2
    exit 1
  }
}

require_bin heroku
require_bin curl
require_bin jq

APP_BASE_URL="$(heroku apps:info -a "$APP_NAME" --json | jq -r '.app.web_url')"
PROM_BASE_URL="$(heroku apps:info -a "$PROM_APP" --json | jq -r '.app.web_url')"
GRAFANA_BASE_URL="$(heroku apps:info -a "$GRAFANA_APP" --json | jq -r '.app.web_url')"

APP_USER="$(heroku config:get -a "$APP_NAME" PN_BASIC_AUTH_USER)"
APP_PASS="$(heroku config:get -a "$APP_NAME" PN_BASIC_AUTH_PASSWORD)"
GRAFANA_USER="$(heroku config:get -a "$GRAFANA_APP" GF_SECURITY_ADMIN_USER)"
GRAFANA_PASS="$(heroku config:get -a "$GRAFANA_APP" GF_SECURITY_ADMIN_PASSWORD)"

if [ -z "$APP_USER" ] || [ -z "$APP_PASS" ]; then
  echo "ERRO: PN_BASIC_AUTH_USER/PASSWORD nao definidos em $APP_NAME" >&2
  exit 1
fi

if [ -z "$GRAFANA_USER" ] || [ -z "$GRAFANA_PASS" ]; then
  echo "ERRO: GF_SECURITY_ADMIN_USER/PASSWORD nao definidos em $GRAFANA_APP" >&2
  exit 1
fi

metrics_no_auth="$(curl -s -o /dev/null -w '%{http_code}' "${APP_BASE_URL}metrics")"
metrics_with_auth="$(curl -u "$APP_USER:$APP_PASS" -s -o /dev/null -w '%{http_code}' "${APP_BASE_URL}metrics")"

target_health="$(curl -sS "${PROM_BASE_URL}api/v1/targets?state=active" | jq -r '.data.activeTargets[] | select(.labels.job=="neurorelato-backend") | .health' | head -n1)"
up_value="$(curl -sS "${PROM_BASE_URL}api/v1/query?query=up%7Bjob%3D%22neurorelato-backend%22%7D" | jq -r '.data.result[0].value[1] // empty')"
alert_state="$(curl -sS "${PROM_BASE_URL}api/v1/alerts" | jq -r '.data.alerts[]? | select(.labels.alertname=="NeurorelatoBackendDown") | .state' | head -n1)"
grafana_ds_status="$(curl -u "$GRAFANA_USER:$GRAFANA_PASS" -sS "${GRAFANA_BASE_URL}api/datasources/uid/prometheus/health" | jq -r '.status // empty')"

[ "$metrics_no_auth" = "401" ] || {
  echo "FALHA: /metrics sem auth deveria retornar 401, retornou ${metrics_no_auth}" >&2
  exit 1
}

[ "$metrics_with_auth" = "200" ] || {
  echo "FALHA: /metrics com auth deveria retornar 200, retornou ${metrics_with_auth}" >&2
  exit 1
}

[ "$target_health" = "up" ] || {
  echo "FALHA: target neurorelato-backend no Prometheus nao esta up (valor: ${target_health:-vazio})" >&2
  exit 1
}

[ "$up_value" = "1" ] || {
  echo "FALHA: query up{job=\"neurorelato-backend\"} deveria ser 1, retornou ${up_value:-vazio}" >&2
  exit 1
}

[ "$grafana_ds_status" = "OK" ] || {
  echo "FALHA: health do datasource Prometheus no Grafana nao esta OK (valor: ${grafana_ds_status:-vazio})" >&2
  exit 1
}

printf '%s\n' "OK: metrics_no_auth=401"
printf '%s\n' "OK: metrics_with_auth=200"
printf '%s\n' "OK: target_health=up"
printf '%s\n' "OK: up_value=1"
printf '%s\n' "OK: grafana_ds_status=OK"
printf '%s\n' "INFO: NeurorelatoBackendDown state=${alert_state:-inactive}"
