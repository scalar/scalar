FROM node:22-bookworm

ARG PLAYWRIGHT_VERSION
ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV PORT=7001

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm install -g npm@latest
RUN npm install -g @playwright/test@$PLAYWRIGHT_VERSION
# Only Chromium is needed: every Playwright config in the repo runs the
# default (Chromium) project, so bundling Firefox and WebKit only bloats the
# image and slows the per-job container pull in CI.
RUN playwright install --with-deps chromium
RUN chmod -R 777 /ms-playwright

CMD playwright -V && playwright run-server --port ${PORT} --host 0.0.0.0
