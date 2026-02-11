FROM grafana/grafana:11.5.2

COPY observability/heroku/grafana/provisioning/datasources/datasource.yml /etc/grafana/provisioning/datasources/datasource.yml
COPY observability/base/grafana/provisioning/dashboards/dashboards.yml /etc/grafana/provisioning/dashboards/dashboards.yml
COPY observability/base/grafana/dashboards /var/lib/grafana/dashboards
ENV GF_PLUGINS_PREINSTALL_DISABLED=true \
    GF_ANALYTICS_CHECK_FOR_UPDATES=false \
    GF_ANALYTICS_CHECK_FOR_PLUGIN_UPDATES=false

# Para provisionar datasource com URL do Prometheus via env var, renderizamos o YAML
# em runtime (Grafana não garante interpolação de env vars em provisioning em todas versões).
USER root
RUN apk add --no-cache gettext
COPY observability/heroku/grafana/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER grafana

# Evita composicao de entrypoint/CMD do base image e mantém boot previsível no Heroku.
ENTRYPOINT []
# Heroku define PORT dinamicamente; mantemos /run.sh como entrypoint final.
CMD ["sh", "-c", "GF_SERVER_HTTP_PORT=${PORT} /entrypoint.sh"]
