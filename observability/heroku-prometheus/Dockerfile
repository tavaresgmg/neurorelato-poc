FROM prom/prometheus:v3.5.0

COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY --chmod=755 entrypoint.sh /entrypoint.sh

# O container base tem entrypoint proprio (/bin/prometheus). No Heroku, isso pode
# gerar composicao de comando inesperada; fixamos um entrypoint explicito.
ENTRYPOINT ["/entrypoint.sh"]
