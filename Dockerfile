# Lithophane Studio, with the photo wrap tool at /wrap/ and the end cap maker at /cap/, all from this repository.
FROM nginx:1.27-alpine
# nginx listens on HTTP_PORT inside the container; the official image fills it
# into the config from /etc/nginx/templates when the container starts.
ENV HTTP_PORT=8080
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY index.html studio.html geometry.js site.webmanifest /usr/share/nginx/html/
COPY brand/ /usr/share/nginx/html/brand/
COPY wrap/index.html wrap/site.webmanifest /usr/share/nginx/html/wrap/
COPY brand/ /usr/share/nginx/html/wrap/brand/
COPY cap/index.html cap/site.webmanifest /usr/share/nginx/html/cap/
COPY brand/ /usr/share/nginx/html/cap/brand/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${HTTP_PORT}/" || exit 1
