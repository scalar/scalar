# Playwright Testing

1. Ensure you have downloaded Playwright and all its dependencies including the browsers necessary for running the tests
   `pnpm exec playwright install`
   `pnpm playwright:install` or `npx playwright install --with-deps`

2. Ensure the server(s) you want to test is running. For the cdn tests:
   `pnpm --filter cdn-api-reference dev`

3. Run Playwright e2e tests with `pnpm test:e2e` or `pnpm test:e2e:ui` with the option to filter for specific tests like `pnpm test:e2e cdn`

## Visual Regression Testing

We are testing the `api-reference` on the CDN using Playwright's built-in snapshot diffing features.

Changes to the api-reference UI require updated snapshots for testing.

Playwright stores snapshots with a suffix related to the environment it was run in. On mac this will be `-darwin` and on linux it will be `-linux`.

The key snapshot is the `-linux` because that is where the tests run in CI. To update these snapshots from a mac we need to use Docker.

### Update Linux snapshots from a Mac using Docker

<!-- Ensure the service you want to test is running on locally
`pnpm --filter cdn-api-reference dev` for cdn tests or `pnpm --filter web dev` for theme tests -->

Ensure all the apps are running
`pnpm dev`

Build the image
`docker build -t playwright-linux -f playwright/Dockerfile .`

Run the image

MacOS:
`docker run --network="host" -e HOST='host.docker.internal' -it playwright-linux:latest bash`

Linux:
`docker run --network="host" -it playwright-linux:latest bash`

Inside the container update the snapshots
`pnpm test:e2e --update-snapshots`

In another terminal tab

get the container id
`docker ps -alq`

copy the snapshots to your local filesystem, ensure you are in the packages/playwright folder

`docker cp <CONTAINER_ID>:/app/playwright/test/ ./`
