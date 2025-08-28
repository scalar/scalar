FROM node:22-bookworm

ARG PLAYWRIGHT_VERSION
ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV PORT=7001

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm install -g npm@latest
RUN npx -y playwright@$PLAYWRIGHT_VERSION install --with-deps
RUN chmod -R 777 /ms-playwright

CMD npx -y playwright run-server --port ${PORT} --host 0.0.0.0
