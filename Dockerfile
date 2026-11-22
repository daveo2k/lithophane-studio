# Lithophane Studio, with the photo wrap tool at /wrap/ and the end cap maker at /cap/.
# The two tools come from their own repositories, so every build picks up their latest main.
FROM alpine/git:2.47.2 AS tools
WORKDIR /src
# These two lines change whenever the repositories change, so Docker re-clones instead of reusing a stale copy.
ADD https://api.github.com/repos/daveo2k/bauble-image-tool/git/refs/heads/main /tmp/wrap-ref.json
ADD https://api.github.com/repos/daveo2k/bauble-cap/git/refs/heads/main /tmp/cap-ref.json
RUN git clone --depth 1 https://github.com/daveo2k/bauble-image-tool.git wrap \
 && git clone --depth 1 https://github.com/daveo2k/bauble-cap.git cap

FROM nginx:1.27-alpine
# nginx listens on HTTP_PORT inside the container; the official image fills it
# into the config from /etc/nginx/templates when the container starts.
ENV HTTP_PORT=8080
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY index.html studio.html geometry.js site.webmanifest /usr/share/nginx/html/
COPY brand/ /usr/share/nginx/html/brand/
COPY --from=tools /src/wrap/index.html /usr/share/nginx/html/wrap/index.html
COPY --from=tools /src/wrap/brand/ /usr/share/nginx/html/wrap/brand/
COPY --from=tools /src/cap/index.html /usr/share/nginx/html/cap/index.html
COPY --from=tools /src/cap/brand/ /usr/share/nginx/html/cap/brand/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${HTTP_PORT}/" || exit 1
