#!/usr/bin/env sh
set -eu

APP_NAME="${APP_NAME:-neurorelatopoc}"
PROM_APP="${PROM_APP:-neurorelatopoc-prometheus}"
GRAFANA_APP="${GRAFANA_APP:-neurorelatopoc-grafana}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-6}"
SLEEP_SECONDS="${SLEEP_SECONDS:-5}"

require_bin() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERRO: comando ausente: $1" >&2
    exit 1
  }
}

retry_cmd() {
  label="$1"
  shift

  attempt=1
  while :; do
    if "$@"; then
      return 0
    fi

    if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      echo "FALHA: ${label} apos ${MAX_ATTEMPTS} tentativas." >&2
      return 1
    fi

    sleep "$SLEEP_SECONDS"
    attempt=$((attempt + 1))
  done
}

print_json_snippet() {
  raw="$1"
  snippet="$(printf '%s' "$raw" | tr '\n' ' ' | cut -c1-220)"
  echo "WARN: JSON invalido ou inesperado. snippet='${snippet}'" >&2
}

TARGET_HEALTH=""
UP_VALUE=""
GRAFANA_DS_STATUS=""
ALERT_STATE=""

fetch_target_health() {
  raw="$(curl -sS "${PROM_BASE_URL}api/v1/targets?state=active")" || return 1
  if ! printf '%s' "$raw" | jq -e '.data.activeTargets | type == "array"' >/dev/null 2>&1; then
    print_json_snippet "$raw"
    return 1
  fi
  value="$(printf '%s' "$raw" | jq -r '.data.activeTargets[] | select(.labels.job=="neurorelato-backend") | .health' | head -n1)"
  if [ -z "$value" ]; then
    echo "WARN: target neurorelato-backend ainda nao encontrado em activeTargets." >&2
    return 1
  fi
  if [ "$value" != "up" ]; then
    echo "WARN: target neurorelato-backend ainda nao esta up (valor: ${value})." >&2
    return 1
  fi
  TARGET_HEALTH="$value"
}

fetch_up_value() {
  raw="$(curl -sS "${PROM_BASE_URL}api/v1/query?query=up%7Bjob%3D%22neurorelato-backend%22%7D")" || return 1
  if ! printf '%s' "$raw" | jq -e '.data.result | type == "array"' >/dev/null 2>&1; then
    print_json_snippet "$raw"
    return 1
  fi
  value="$(printf '%s' "$raw" | jq -r '.data.result[0].value[1] // empty')"
  if [ -z "$value" ]; then
    echo "WARN: query up ainda sem valor para neurorelato-backend." >&2
    return 1
  fi
  if [ "$value" != "1" ]; then
    echo "WARN: query up ainda diferente de 1 (valor: ${value})." >&2
    return 1
  fi
  UP_VALUE="$value"
}

fetch_alert_state() {
  raw="$(curl -sS "${PROM_BASE_URL}api/v1/alerts")" || return 1
  if ! printf '%s' "$raw" | jq -e '.data.alerts | type == "array"' >/dev/null 2>&1; then
    print_json_snippet "$raw"
    return 1
  fi
  ALERT_STATE="$(printf '%s' "$raw" | jq -r '.data.alerts[]? | select(.labels.alertname=="NeurorelatoBackendDown") | .state' | head -n1)"
}

fetch_grafana_ds_status() {
  raw="$(curl -u "$GRAFANA_USER:$GRAFANA_PASS" -sS "${GRAFANA_BASE_URL}api/datasources/uid/prometheus/health")" || return 1
  if ! printf '%s' "$raw" | jq -e '.status? != null' >/dev/null 2>&1; then
    print_json_snippet "$raw"
    return 1
  fi
  value="$(printf '%s' "$raw" | jq -r '.status // empty')"
  if [ -z "$value" ]; then
    echo "WARN: health do datasource retornou status vazio." >&2
    return 1
  fi
  if [ "$value" != "OK" ]; then
    echo "WARN: status do datasource ainda nao esta OK (valor: ${value})." >&2
    return 1
  fi
  GRAFANA_DS_STATUS="$value"
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

retry_cmd "target neurorelato-backend em /api/v1/targets" fetch_target_health
retry_cmd "query up{job=neurorelato-backend}" fetch_up_value
retry_cmd "health do datasource Prometheus no Grafana" fetch_grafana_ds_status
retry_cmd "consulta de alertas Prometheus" fetch_alert_state

[ "$metrics_no_auth" = "401" ] || {
  echo "FALHA: /metrics sem auth deveria retornar 401, retornou ${metrics_no_auth}" >&2
  exit 1
}

[ "$metrics_with_auth" = "200" ] || {
  echo "FALHA: /metrics com auth deveria retornar 200, retornou ${metrics_with_auth}" >&2
  exit 1
}

[ "$TARGET_HEALTH" = "up" ] || {
  echo "FALHA: target neurorelato-backend no Prometheus nao esta up (valor: ${TARGET_HEALTH:-vazio})" >&2
  exit 1
}

[ "$UP_VALUE" = "1" ] || {
  echo "FALHA: query up{job=\"neurorelato-backend\"} deveria ser 1, retornou ${UP_VALUE:-vazio}" >&2
  exit 1
}

[ "$GRAFANA_DS_STATUS" = "OK" ] || {
  echo "FALHA: health do datasource Prometheus no Grafana nao esta OK (valor: ${GRAFANA_DS_STATUS:-vazio})" >&2
  exit 1
}

printf '%s\n' "OK: metrics_no_auth=401"
printf '%s\n' "OK: metrics_with_auth=200"
printf '%s\n' "OK: target_health=${TARGET_HEALTH}"
printf '%s\n' "OK: up_value=${UP_VALUE}"
printf '%s\n' "OK: grafana_ds_status=${GRAFANA_DS_STATUS}"
printf '%s\n' "INFO: NeurorelatoBackendDown state=${ALERT_STATE:-inactive}"
