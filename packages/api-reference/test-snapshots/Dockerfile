FROM node:22-bookworm

ARG DOCKER_IMAGE_NAME_TEMPLATE="scalarapi/playwright:v1.55.0"
ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install && npx playwright install-deps
RUN chmod -R 777 /ms-playwright