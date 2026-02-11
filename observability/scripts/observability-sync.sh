#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"

MODE="${1:-sync}"
CHECK_ONLY=0
case "$MODE" in
  sync)
    CHECK_ONLY=0
    ;;
  --check)
    CHECK_ONLY=1
    ;;
  *)
    echo "Uso: $0 [sync|--check]" >&2
    exit 1
    ;;
esac

CANONICAL_DASHBOARD="${ROOT_DIR}/observability/base/grafana/dashboards/neurorelato-observability.json"
CANONICAL_GRAFANA_DASHBOARDS_CFG="${ROOT_DIR}/observability/base/grafana/provisioning/dashboards/dashboards.yml"

LEGACY_HEROKU_DASHBOARD="${ROOT_DIR}/observability/heroku-grafana/dashboards/neurorelato-observability.json"
LEGACY_HEROKU_DASHBOARDS_CFG="${ROOT_DIR}/observability/heroku-grafana/provisioning/dashboards/dashboards.yml"
HEROKU_GRAFANA_DASHBOARD_SHADOW="${ROOT_DIR}/observability/heroku/grafana/dashboards/neurorelato-observability.json"
HEROKU_GRAFANA_DASHBOARDS_SHADOW_CFG="${ROOT_DIR}/observability/heroku/grafana/provisioning/dashboards/dashboards.yml"

PROM_BACKEND_TEMPLATE="${ROOT_DIR}/observability/base/prometheus/templates/backend-job.yml.tmpl"
PROM_LOCAL_OUT="${ROOT_DIR}/observability/base/prometheus/prometheus.yml"
PROM_HEROKU_OUT="${ROOT_DIR}/observability/heroku/prometheus/prometheus.yml"

require_bin() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERRO: comando ausente: $1" >&2
    exit 1
  }
}

ensure_file() {
  file="$1"
  [ -f "$file" ] || {
    echo "ERRO: arquivo esperado nao encontrado: $file" >&2
    exit 1
  }
}

check_or_remove_legacy() {
  path="$1"
  if [ "$CHECK_ONLY" -eq 1 ]; then
    if [ -e "$path" ]; then
      echo "FALHA: arquivo legado duplicado ainda existe: $path" >&2
      return 1
    fi
    return 0
  fi

  if [ -e "$path" ]; then
    rm -f "$path"
    echo "SYNC: removido legado duplicado: $path"
  fi
  return 0
}

sync_file() {
  source_file="$1"
  target_file="$2"

  if [ "$CHECK_ONLY" -eq 1 ]; then
    if ! cmp -s "$source_file" "$target_file"; then
      echo "FALHA: drift detectado em $target_file (rode $0 sync)." >&2
      return 1
    fi
    return 0
  fi

  if ! cmp -s "$source_file" "$target_file"; then
    cp "$source_file" "$target_file"
    echo "SYNC: atualizado $target_file"
  fi
  return 0
}

render_backend_job() {
  out_file="$1"
  scheme_value="$2"
  target_value="$3"
  auth_mode="$4"

  basic_auth_block=""
  if [ "$auth_mode" = "with_auth" ]; then
    basic_auth_block="$(cat <<'EOF'
    basic_auth:
      username: ${PN_METRICS_BASIC_AUTH_USER}
      password: ${PN_METRICS_BASIC_AUTH_PASSWORD}
EOF
)"
    basic_auth_block="${basic_auth_block}
"
  fi

  PN_BACKEND_JOB_NAME="neurorelato-backend"
  PN_BACKEND_SCHEME="$scheme_value"
  PN_BACKEND_METRICS_PATH="/metrics"
  PN_BACKEND_TARGET="$target_value"
  PN_BACKEND_BASIC_AUTH_BLOCK="$basic_auth_block"
  export PN_BACKEND_JOB_NAME PN_BACKEND_SCHEME PN_BACKEND_METRICS_PATH PN_BACKEND_TARGET PN_BACKEND_BASIC_AUTH_BLOCK

  envsubst < "$PROM_BACKEND_TEMPLATE" > "$out_file"
}

render_prometheus_local() {
  out_file="$1"
  backend_job_file="$2"

  cat > "$out_file" <<'EOF'
global:
  scrape_interval: 10s
  evaluation_interval: 10s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["prometheus:9090"]

EOF
  cat "$backend_job_file" >> "$out_file"
}

render_prometheus_heroku() {
  out_file="$1"
  backend_job_file="$2"

  cat > "$out_file" <<'EOF'
global:
  scrape_interval: 10s
  evaluation_interval: 10s

rule_files:
  - /etc/prometheus/alert_rules.yml

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["127.0.0.1:${PORT}"]

EOF
  cat "$backend_job_file" >> "$out_file"
}

require_bin envsubst
require_bin cmp
require_bin jq

ensure_file "$CANONICAL_DASHBOARD"
ensure_file "$CANONICAL_GRAFANA_DASHBOARDS_CFG"
ensure_file "$PROM_BACKEND_TEMPLATE"
ensure_file "$PROM_LOCAL_OUT"
ensure_file "$PROM_HEROKU_OUT"

jq -e . "$CANONICAL_DASHBOARD" >/dev/null

tmp_backend_local="$(mktemp)"
tmp_backend_heroku="$(mktemp)"
tmp_prom_local="$(mktemp)"
tmp_prom_heroku="$(mktemp)"
trap 'rm -f "$tmp_backend_local" "$tmp_backend_heroku" "$tmp_prom_local" "$tmp_prom_heroku"' EXIT

render_backend_job "$tmp_backend_local" "http" "backend:8000" "without_auth"
render_backend_job "$tmp_backend_heroku" "https" '${PN_METRICS_TARGET}' "with_auth"
render_prometheus_local "$tmp_prom_local" "$tmp_backend_local"
render_prometheus_heroku "$tmp_prom_heroku" "$tmp_backend_heroku"

sync_file "$tmp_prom_local" "$PROM_LOCAL_OUT"
sync_file "$tmp_prom_heroku" "$PROM_HEROKU_OUT"

check_or_remove_legacy "$LEGACY_HEROKU_DASHBOARD"
check_or_remove_legacy "$LEGACY_HEROKU_DASHBOARDS_CFG"
check_or_remove_legacy "$HEROKU_GRAFANA_DASHBOARD_SHADOW"
check_or_remove_legacy "$HEROKU_GRAFANA_DASHBOARDS_SHADOW_CFG"

if [ "$CHECK_ONLY" -eq 1 ]; then
  echo "OK: observability sem drift."
else
  echo "OK: observability sincronizada."
fi
