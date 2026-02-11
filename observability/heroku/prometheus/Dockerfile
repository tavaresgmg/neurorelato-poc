FROM golang:1.24-alpine AS build-envsubst
RUN go install github.com/a8m/envsubst/cmd/envsubst@v1.4.3

FROM prom/prometheus:v3.5.0

COPY observability/heroku/prometheus/prometheus.yml /etc/prometheus/prometheus.yml
COPY observability/heroku/prometheus/alert_rules.yml /etc/prometheus/alert_rules.yml
COPY --chmod=755 observability/heroku/prometheus/entrypoint.sh /entrypoint.sh
COPY --from=build-envsubst /go/bin/envsubst /usr/local/bin/envsubst

# O container base tem entrypoint proprio (/bin/prometheus). No Heroku, isso pode
# gerar composicao de comando inesperada; fixamos um entrypoint explicito.
ENTRYPOINT ["/entrypoint.sh"]
