#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
SYNC_SCRIPT="${ROOT_DIR}/observability/scripts/observability-sync.sh"

PROM_APP="${PROM_APP:-neurorelatopoc-prometheus}"
GRAFANA_APP="${GRAFANA_APP:-neurorelatopoc-grafana}"

TARGET="${1:-all}"

require_heroku() {
  command -v heroku >/dev/null 2>&1 || {
    echo "ERRO: heroku CLI nao encontrado." >&2
    exit 1
  }
}

require_sync_script() {
  [ -x "$SYNC_SCRIPT" ] || {
    echo "ERRO: script de sync ausente ou sem permissao de execucao: $SYNC_SCRIPT" >&2
    exit 1
  }
}

deploy_service() {
  service_dir="$1"
  app_name="$2"

  echo "[deploy] app=${app_name} dir=${service_dir}"
  (
    cd "${ROOT_DIR}/${service_dir}"
    heroku container:push web -a "${app_name}" --context-path "${ROOT_DIR}"
    heroku container:release web -a "${app_name}"
  )
}

require_heroku
require_sync_script
"$SYNC_SCRIPT" --check
heroku container:login

case "$TARGET" in
  prometheus)
    deploy_service "observability/heroku/prometheus" "$PROM_APP"
    ;;
  grafana)
    deploy_service "observability/heroku/grafana" "$GRAFANA_APP"
    ;;
  all)
    deploy_service "observability/heroku/prometheus" "$PROM_APP"
    deploy_service "observability/heroku/grafana" "$GRAFANA_APP"
    ;;
  *)
    echo "Uso: $0 [prometheus|grafana|all]" >&2
    exit 1
    ;;
esac

echo "[ok] deploy de observabilidade concluido"
